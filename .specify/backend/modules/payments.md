# Payments Module

## Purpose

Handles payment processing through MercadoPago integration for the Colombian market.

## Responsibilities

- MercadoPago preference creation
- Payment webhook handling
- Payment status synchronization
- Payment confirmation flow
- Failed payment handling

## Architecture

```
modules/payments/
├── domain/
│   ├── entities/
│   │   └── payment.entity.ts
│   └── ports/
│       └── payment-gateway.port.ts
├── application/
│   ├── use-cases/
│   │   ├── create-mercadopago-preference.use-case.ts
│   │   ├── process-mercadopago-payment.use-case.ts
│   │   ├── handle-mercadopago-webhook.use-case.ts
│   │   └── refund-payment.use-case.ts
│   └── payments.service.ts
├── infrastructure/
│   ├── http/
│   │   ├── payments.controller.ts
│   │   └── dto/
│   │       ├── create-preference.dto.ts
│   │       └── webhook.dto.ts
│   ├── persistence/
│   │   └── prisma-payments.repository.ts
│   └── mercadopago/
│       ├── mercadopago.adapter.ts
│       └── mercadopago.config.ts
│   └── queue/
│       ├── payment-confirmation.notifier.ts
│       └── payment-confirmation.processor.ts
└── payments.module.ts
```

## MercadoPago Integration

### Configuration

```env
MP_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Payment Flow

```
┌──────────┐    Create Preference     ┌─────────────┐
│  Client  │───────────────────────▶│   Mercado   │
│          │◀───────────────────────│   Pago      │
└──────────┘   init_point (URL)      └─────────────┘
     │                                        │
     │  Redirect customer to MercadoPago      │
     │                                        │
     │  Customer completes payment          │
     │                                        │
     │  Webhook notification                │
     ▼                                        ▼
┌──────────┐                            ┌──────────┐
│  Nexstore │◀─────────────────────────│ Webhook  │
│  Backend  │    Payment status update   │ Handler  │
└──────────┘                            └──────────┘
     │
     │  Queue job
     ▼
┌──────────┐
│  Process  │
│  Payment  │
└──────────┘
```

## Use Cases

### Create MercadoPago Preference

```typescript
class CreateMercadoPagoPreferenceUseCase {
  async execute(orderId: string): Promise<MercadoPagoPreference> {
    const order = await this.orderRepo.findById(orderId);
    
    // Validate order is pending
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not pending');
    }

    // Build MercadoPago preference
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

    const mpPreference = await this.mercadoPago.createPreference(preference);

    return {
      initPoint: mpPreference.init_point,
      sandboxInitPoint: mpPreference.sandbox_init_point,
      preferenceId: mpPreference.id,
    };
  }
}
```

### Handle Webhook

```typescript
class HandleMercadoPagoWebhookUseCase {
  async execute(payload: MercadoPagoWebhookDto): Promise<void> {
    const { payment_id, external_reference, status } = payload;

    // Verify signature (if applicable)
    // MercadoPago webhooks can be verified via IP or signature

    // Queue payment processing (async)
    await this.queue.add('process-payment', {
      paymentId: payment_id,
      orderId: external_reference,
      status,
    });

    // Return immediately (202 Accepted)
  }
}
```

### Process Payment (Queue)

```typescript
@Processor('payment-confirmation')
class PaymentConfirmationProcessor {
  @Process('process-payment')
  async handlePayment(job: Job<PaymentJobData>) {
    const { paymentId, orderId, status } = job.data;

    // Fetch payment details from MercadoPago
    const payment = await this.mercadoPago.getPayment(paymentId);

    if (payment.status === 'approved') {
      await this.confirmPayment(orderId, paymentId);
    } else if (payment.status === 'rejected') {
      await this.handleFailedPayment(orderId, payment);
    }
    // 'in_process' and 'pending' are handled by subsequent webhooks
  }

  private async confirmPayment(orderId: string, transactionId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          isPaid: true,
          paidAt: new Date(),
          transactionId,
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
          orderId,
        );
      }
    });
  }

  private async handleFailedPayment(orderId: string, payment: MercadoPagoPayment) {
    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING,  // Keep pending for retry
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    // Release reserved inventory
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    for (const item of order.items) {
      await this.inventoryService.releaseStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        orderId,
      );
    }

    // Log failure reason
    this.logger.warn(`Payment failed for order ${orderId}: ${payment.status_detail}`);
  }
}
```

## Data Models

### Prisma (Payment Status on Order)

```prisma
model Order {
  id            String        @id @default(uuid())
  subTotal      Float
  tax           Float
  total         Float
  isPaid        Boolean       @default(false)
  paidAt        DateTime?
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  transactionId String?       // MercadoPago payment ID
  
  // ... other fields
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

## MercadoPago Status Mapping

| MercadoPago Status | Internal Status | Action |
|-------------------|-----------------|--------|
| approved | PAID | Commit stock, update order |
| pending | PENDING | Wait for next webhook |
| in_process | PENDING | Wait for next webhook |
| rejected | FAILED | Release reserved stock |
| cancelled | FAILED | Release reserved stock |
| refunded | REFUNDED | Reverse commit, refund |

## Controllers

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/payments/mercadopago/create | Required | Create preference |
| POST | /api/payments/mercadopago/webhook | Public | Webhook handler |

## Webhook Security

MercadoPago webhooks should be verified:

```typescript
// IP whitelist approach
const ALLOWED_IPS = ['...'];  // MercadoPago IPs

@Post('webhook')
handleWebhook(@Req() req, @Body() payload) {
  const clientIp = req.ip;
  if (!ALLOWED_IPS.includes(clientIp)) {
    throw new UnauthorizedException();
  }
  // Process webhook
}
```

## Queue Configuration

```typescript
BullModule.registerQueue({
  name: 'payment-confirmation',
  processors: [
    {
      name: 'process-payment',
      concurrency: 5,
    },
  ],
}),
```

## Environment Variables

```env
# Required
MP_ACCESS_TOKEN=APP_USR-...

# Derived
FRONTEND_ORIGIN=http://localhost:5000
BACKEND_URL=http://localhost:5001
```

## Testing

### Sandbox Mode

MercadoPago provides test cards:
- Approved: `5031 7557 3453 0604` (Visa)
- Rejected: `4000 0000 0000 0002`

### Webhook Testing

Use ngrok for local webhook testing:
```bash
ngrok http 5001
# Update notification_url to ngrok URL
```

## References

- [API Reference](../api-reference.md#payments)
- [MercadoPago Docs](https://www.mercadopago.com.co/developers)
- [Redis & BullMQ](../../infrastructure/redis-bullmq.md)
