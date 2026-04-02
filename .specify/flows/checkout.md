# Checkout Flow

## Overview

Complete purchase flow from cart to order confirmation.

## Flow Diagram

```
┌──────────┐    1. Add to Cart    ┌──────────┐    2. View Cart    ┌──────────┐
│  Product │────────────────────▶│   Cart   │───────────────────▶│  Cart    │
│   Page   │                     │ Context  │                   │   Page   │
└──────────┘                     └──────────┘                   └────┬─────┘
                                                                      │
                                                                      │ 3. Proceed
                                                                      │    to Checkout
                                                                      ▼
                                                               ┌──────────┐
                                                               │ Checkout │
                                                               │   Page   │
                                                               └────┬─────┘
                                                                    │
                                                                    │ 4. Enter
                                                                    │    Details
                                                                    ▼
┌──────────┐    9. Confirm Order    ┌──────────┐    5. Create    ┌──────────┐
│  Order   │◀──────────────────────│  Payment │◀───────────────│   API    │
│ Success  │                       │ Gateway  │                │          │
│   Page   │                       │          │                │ 6. Reserve│
└──────────┘                       └────┬─────┘                │    Stock  │
                                      │                      └──────────┘
                                      │ 7. Pay                    │
                                      │                           │ 8. Queue
                                      ▼                           ▼    Job
                               ┌──────────┐                 ┌──────────┐
                               │ Customer │                 │ Process  │
                               │  Pays    │                 │ Payment  │
                               └──────────┘                 └──────────┘
```

## Step-by-Step

### 1. Add to Cart

Customer selects product, size, and quantity.

```tsx
// features/product-detail/components/add-to-cart.tsx
'use client';

export function AddToCart({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState('');
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      productId: product.id,
      quantity: 1,
      size: selectedSize,
      price: product.price,
    });
    toast.success('Added to cart');
  };

  return (
    <div>
      <SizeSelector sizes={product.sizes} onSelect={setSelectedSize} />
      <Button onClick={handleAdd} disabled={!selectedSize}>
        Add to Cart
      </Button>
    </div>
  );
}
```

### 2. Cart Context

Manages cart state in memory (not persisted):

```tsx
// contexts/cart-context.tsx
'use client';

interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  price: number;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => 
        i.productId === item.productId && i.size === item.size
      );
      
      if (existing) {
        return prev.map(i => 
          i === existing 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      
      return [...prev, item];
    });
  };

  const removeItem = (productId: string, size: string) => {
    setItems(prev => prev.filter(i => 
      !(i.productId === productId && i.size === size)
    ));
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, total }}>
      {children}
    </CartContext.Provider>
  );
}
```

### 3. Checkout Page

Collects customer information:

```tsx
// app/checkout/page.tsx
'use client';

import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    
    try {
      const order = await createOrder({
        items,
        address: formData.address,
        guestEmail: user ? undefined : formData.email,
      });
      
      // Redirect to payment
      router.push(`/checkout/payment?orderId=${order.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <CheckoutForm onSubmit={handleSubmit} user={user} />
      <OrderSummary items={items} total={total} />
    </div>
  );
}
```

### 4. Create Order (Backend)

Reserves inventory and creates order:

```typescript
// modules/orders/application/use-cases/create-order.use-case.ts
async execute(dto: CreateOrderDto, userId?: string): Promise<Order> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Validate items and check stock
    const validatedItems = await Promise.all(
      dto.items.map(async item => {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventories: true },
        });
        
        if (!product) throw new NotFoundException();
        
        // Check stock availability
        const inventory = product.inventories[0]; // Default warehouse
        if (inventory.availableQuantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.title}`);
        }
        
        return { ...item, price: product.price, inventoryId: inventory.id };
      })
    );

    // 2. Calculate totals
    const subTotal = validatedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const tax = subTotal * TAX_RATE;  // 15%
    const total = subTotal + tax;

    // 3. Reserve stock for each item
    for (const item of validatedItems) {
      await this.inventoryService.reserveStock(
        item.productId,
        item.inventoryId,
        item.quantity,
      );
    }

    // 4. Create order
    const order = await tx.order.create({
      data: {
        subTotal,
        tax,
        total,
        itemsInOrder: validatedItems.length,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        userId,
        guestEmail: dto.guestEmail,
        guestCheckoutToken: userId ? undefined : crypto.randomUUID(),
        items: {
          create: validatedItems.map(item => ({
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            productId: item.productId,
          })),
        },
        address: {
          create: dto.address,
        },
      },
      include: { items: { include: { product: true } }, address: true },
    });

    return order;
  });
}
```

### 5. Payment Processing

Creates MercadoPago preference:

```typescript
// modules/payments/application/use-cases/create-mercadopago-preference.use-case.ts
async execute(orderId: string): Promise<MercadoPagoPreference> {
  const order = await this.orderRepo.findById(orderId);
  
  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException('Order is not pending');
  }

  const preference = {
    items: order.items.map(item => ({
      title: item.product.title,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'COP',
    })),
    external_reference: orderId,
    back_urls: {
      success: `${FRONTEND_URL}/checkout/success`,
      failure: `${FRONTEND_URL}/checkout/failure`,
      pending: `${FRONTEND_URL}/checkout/pending`,
    },
    notification_url: `${BACKEND_URL}/api/payments/mercadopago/webhook`,
    auto_return: 'approved',
  };

  const mpPreference = await this.mercadoPago.preferences.create(preference);

  return {
    initPoint: mpPreference.init_point,
    sandboxInitPoint: mpPreference.sandbox_init_point,
    preferenceId: mpPreference.id,
  };
}
```

### 6. Customer Payment

Customer is redirected to MercadoPago:

```tsx
// app/checkout/payment/page.tsx
'use client';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [preference, setPreference] = useState<MercadoPagoPreference | null>(null);

  useEffect(() => {
    if (orderId) {
      createPreference(orderId).then(setPreference);
    }
  }, [orderId]);

  if (!preference) return <Loading />;

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
      <p className="mb-8">You will be redirected to MercadoPago to complete your purchase.</p>
      <Button 
        as="a" 
        href={preference.initPoint} 
        color="primary"
        size="lg"
      >
        Pay with MercadoPago
      </Button>
    </div>
  );
}
```

### 7. Webhook Processing

MercadoPago sends webhook on payment status change:

```typescript
// modules/payments/infrastructure/http/payments.controller.ts
@Post('mercadopago/webhook')
async webhook(@Body() payload: MercadoPagoWebhookDto) {
  // Queue for async processing
  await this.paymentQueue.add('process-payment', {
    paymentId: payload.payment_id,
    orderId: payload.external_reference,
    status: payload.status,
  });

  return { received: true };
}
```

### 8. Process Payment (Queue)

```typescript
// modules/payments/infrastructure/queue/payment-confirmation.processor.ts
@Process('process-payment')
async handlePayment(job: Job<PaymentJobData>) {
  const { paymentId, orderId, status } = job.data;

  const payment = await this.mercadoPago.payment.get(paymentId);

  if (payment.status === 'approved') {
    await this.confirmOrder(orderId, paymentId);
  } else if (payment.status === 'rejected') {
    await this.handleFailedPayment(orderId, payment);
  }
}

private async confirmOrder(orderId: string, paymentId: string) {
  await this.prisma.$transaction(async (tx) => {
    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        isPaid: true,
        paidAt: new Date(),
        transactionId: paymentId,
      },
    });

    // Commit inventory
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    for (const item of order.items) {
      await this.inventoryService.commitStock(
        item.productId,
        item.warehouseId,
        item.quantity,
      );
    }
  });
}
```

### 9. Success Page

```tsx
// app/checkout/success/page.tsx
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { external_reference: string }
}) {
  const order = await getOrderById(searchParams.external_reference);

  return (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
      <p className="mb-4">Thank you for your purchase.</p>
      <p className="text-gray-600">Order ID: {order.id}</p>
      <p className="text-gray-600">Total: ${order.total}</p>
      <Button as={Link} href={`/orders/${order.id}`} className="mt-8">
        View Order
      </Button>
    </div>
  );
}
```

## State Transitions

| Step | Order Status | Payment Status | Inventory State |
|------|--------------|----------------|-----------------|
| Cart | — | — | Available |
| Order Created | PENDING | PENDING | Reserved |
| Payment Processing | PENDING | PENDING | Reserved |
| Payment Approved | PAID | PAID | Committed |
| Payment Rejected | PENDING | FAILED | Released |
| Order Cancelled | CANCELLED | — | Released |

## Guest Checkout

Guest orders work without account:

```typescript
// Guest checkout includes email for order tracking
const order = await createOrder({
  items,
  address,
  guestEmail: 'customer@example.com',  // Required for guests
});

// Guest receives email with order link:
// https://nexstore.com/orders/[order-id]?token=[guest-token]
```

## Error Scenarios

| Scenario | Handling |
|----------|----------|
| Insufficient stock | Error at order creation, no reservation |
| Payment timeout | Stock auto-releases after 30 min (future) |
| Payment rejected | Stock released, customer notified |
| Webhook failure | Retry queue handles it |

## References

- [Orders Module](../../backend/modules/orders.md)
- [Payments Module](../../backend/modules/payments.md)
- [Inventory Module](../../backend/modules/inventory.md)
