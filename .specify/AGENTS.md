# Agent Guidelines — SellFlow System

## Agent Mission

You are building **SellFlow System** — a WhatsApp-based order management platform for small businesses in Latin America.

**THIS IS NOT A GENERIC E-COMMERCE.** This is a specialized business tool that solves real operational problems for businesses selling via WhatsApp.

---

## Core Principles

### 1. Product-First Thinking

- **Always refer to `.specify/spec.md`** before implementing features
- Every feature must solve a real business problem
- Ask: "How does this help María (beauty store owner) or Carlos (hardware manager)?"

### 2. Business Context is Mandatory

- **DON'T**: Build "shopping cart" or "checkout" features
- **DO**: Build "order capture from WhatsApp" and "status confirmation workflow"

- **DON'T**: Add "payment gateway integration"
- **DO**: Add "payment tracking for cash and bank transfers"

- **DON'T**: Create "product reviews"
- **DO**: Create "customer purchase history and quick reorder"

### 3. Target User Empathy

Our users are:
- Small business owners, not tech-savvy
- Using phones as primary work device
- Managing 10-100 orders daily via WhatsApp
- Need speed and simplicity over feature richness

**Design for mobile-first, thumb-friendly, minimal clicks.**

---

## Documentation Hierarchy (Read Order)

When starting any task, read in this order:

1. **`.specify/spec.md`** — Product definition, user personas, features
2. **`.specify/plan.md`** — Technical architecture, module structure
3. **`.specify/AGENTS.md`** — This file (agent guidelines)
4. **Specific module docs** — If working on a specific domain

---

## Domain Language

Use these terms consistently:

| Term | Meaning | Don't Use |
|------|---------|-----------|
| **Order** | Purchase request from customer | Cart, Checkout |
| **Draft** | Unconfirmed order being prepared | Pending cart |
| **Confirmed** | Order accepted, stock reserved | Paid order |
| **Customer** | Person who buys via WhatsApp | User, Shopper |
| **Operator** | Staff member processing orders | Admin, Clerk |
| **Inventory** | Stock tracking system | Stock only |
| **WhatsApp Flow** | Chat-based order process | Conversational commerce |

---

## Implementation Guidelines

### Orders Module

```typescript
// CORRECT: WhatsApp-centric order
interface Order {
  id: string;
  customerId: string;      // Linked to WhatsApp number
  status: OrderStatus;     // DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
  items: OrderItem[];
  whatsappNotes?: string;  // Notes from chat conversation
  createdBy: string;       // Operator who captured the order
  confirmedAt?: Date;      // When customer confirmed via WhatsApp
}

// INCORRECT: Generic e-commerce
interface Cart {
  sessionId: string;       // No sessions in WhatsApp flow
  items: CartItem[];
  abandonedAt?: Date;      // Not relevant
}
```

### Inventory Module

- Stock must be reserved (not deducted) when order is CONFIRMED
- Stock is actually deducted only when order is DELIVERED
- Low stock alerts are critical — don't batch, notify immediately
- Track WHO made every inventory change (audit trail)

### Customer Module

- WhatsApp number is the PRIMARY identifier
- Display recent orders first (quick context)
- Show total lifetime value prominently
- Enable one-click reorder from history

---

## Code Organization

### Backend (NestJS)

```
back/src/modules/
├── orders/
│   ├── orders.module.ts
│   ├── orders.service.ts      # Business logic
│   ├── orders.controller.ts   # API endpoints
│   ├── orders.repository.ts   # Data access
│   └── dto/
├── inventory/
├── customers/
├── products/
└── auth/
```

### Frontend (Next.js)

```
front/src/app/(dashboard)/
├── orders/
│   ├── page.tsx               # Order list
│   ├── [id]/
│   │   └── page.tsx           # Order detail
│   └── components/
│       ├── OrderCard.tsx
│       └── OrderStatusBadge.tsx
├── customers/
├── products/
└── inventory/
```

---

## Critical Rules

### NEVER Do These

1. **Don't build a public storefront** — This is an admin tool, not a customer-facing shop
2. **Don't add payment processing** — Track payments manually (cash, transfer, etc.)
3. **Don't build automated chatbots** — Operators handle all customer communication
4. **Don't use generic e-commerce patterns** — No "add to cart", "checkout", "guest checkout"
5. **Don't ignore mobile** — Primary use case is mobile/tablet

### ALWAYS Do These

1. **Think in WhatsApp flows** — Orders come from conversations
2. **Design for speed** — Minimum clicks for common actions
3. **Preserve audit trails** — Who did what, when
4. **Handle errors gracefully** — Stock conflicts happen, handle them
5. **Test with personas** — Would María understand this?

---

## Feature Prioritization

### P0 — Core (Must Have)

- Create draft order from customer WhatsApp
- Confirm order and reserve inventory
- Track order status through delivery
- View customer history and quick reorder
- Inventory alerts when stock low

### P1 — Important (Should Have)

- Product catalog with images
- Multi-location inventory
- User roles (admin/manager/operator)
- Basic sales reports
- Customer tags/segments

### P2 — Nice to Have

- WhatsApp Business API integration
- Advanced analytics
- Multi-currency support
- Supplier management

---

## Common Patterns

### Order Status Flow

```
DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
  ↓        ↓            ↓           ↓         ↓
Stock:   Stock:       Stock:      Stock:    Stock:
-none-  reserved    reserved    reserved  committed
                       ↓
                  CANCELLED → Stock released
```

### Error Handling

```typescript
// Stock conflict during confirmation
try {
  await orderService.confirm(orderId);
} catch (error) {
  if (error instanceof InsufficientStockError) {
    // Show operator: "Only 3 units available, customer ordered 5"
    // Let operator decide: adjust quantity or notify customer
  }
}
```

---

## Testing Mindset

### Test Scenarios

1. **Happy path**: Customer messages → Operator creates draft → Confirms order → Delivers
2. **Stock conflict**: Two operators try to confirm orders for last item simultaneously
3. **Order modification**: Customer changes mind after confirmation
4. **Cancellation flow**: Order cancelled at different stages
5. **Mobile experience**: Complete order flow on 375px wide screen

### Test Users

Use these credentials when testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sellflow.local | Qwert.12345 |
| Manager | manager@sellflow.local | Qwert.12345 |
| Operator | operator@sellflow.local | Qwert.12345 |

---

## Getting Help

### When Stuck

1. Re-read `.specify/spec.md` — The answer is usually there
2. Check user personas — What would María need?
3. Review existing code patterns — Follow established conventions
4. Ask: "Does this feel like a generic e-commerce feature?" — If yes, reconsider

### Decision Framework

```
Does this feature...
├── Solve a real problem for our target users?
├── Fit the WhatsApp-first sales model?
├── Work on mobile devices?
└── Maintain simplicity over complexity?

If all YES → Proceed
If any NO  → Reconsider or ask
```

---

## Commit Message Format

```
feat(orders): add draft order creation from customer chat

- WhatsApp number auto-fills customer lookup
- Shows recent customer orders for context
- Mobile-optimized form layout

Closes: #123
```

---

## Remember

> **"We are building a business operations tool, not a shopping website. Every pixel, every API, every workflow should serve the business owner managing WhatsApp sales."**

---

*Last updated: April 2026*
*Product Owner: Luis David Lopera*
