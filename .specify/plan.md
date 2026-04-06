# SellFlow System — Technical Plan

## Overview

This document outlines the technical architecture and implementation plan for the **SellFlow System** — a WhatsApp-based order management platform for small businesses.

**Product Vision**: Enable businesses selling via WhatsApp to manage orders, inventory, and customers with professional-grade tools while maintaining the conversational nature of their sales process.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 + TypeScript | Admin panel, customer management, order interface |
| **Backend** | NestJS + TypeScript | API, business logic, background jobs |
| **Database** | PostgreSQL 16 + Prisma ORM | Data persistence, transactions, relationships |
| **Queue/Cache** | Redis 7 + BullMQ | Background jobs, stock alerts, session cache |
| **Storage** | Cloudflare R2 (S3-compatible) | Product images, customer attachments |
| **Auth** | JWT + RBAC | Secure access, role-based permissions |
| **Containerization** | Docker + Docker Compose | Local development, deployment consistency |

---

## Core Domain Modules

### 1. Orders Module

**Purpose**: Manage the complete order lifecycle from WhatsApp capture to delivery.

**Key Entities**:
- `Order` - Order header with customer, status, totals
- `OrderItem` - Line items with product, quantity, price
- `OrderStatusHistory` - Audit trail of status changes

**Business Rules**:
- Orders start as DRAFT (captured from WhatsApp)
- Stock reserved when order CONFIRMED
- Stock released if order CANCELLED
- Status transitions are strictly controlled

**Key Services**:
- `OrderService` - CRUD, status transitions
- `OrderWorkflowService` - State machine logic
- `OrderNotificationService` - Customer notifications

### 2. Inventory Module

**Purpose**: Real-time stock tracking with multi-location support.

**Key Entities**:
- `InventoryItem` - Stock level per product per location
- `StockMovement` - Every inventory change tracked
- `Warehouse` - Storage locations (store, warehouse, etc.)

**Business Rules**:
- No negative stock (configurable per product)
- All movements create audit records
- Low stock triggers alert job
- Reserved stock vs available stock distinction

**Key Services**:
- `InventoryService` - Stock queries, adjustments
- `StockReservationService` - Handle order reservations
- `StockAlertService` - Generate low-stock notifications
- `StockMovementService` - Record all inventory changes

### 3. Customers Module

**Purpose**: Customer profiles with purchase history and segmentation.

**Key Entities**:
- `Customer` - Contact info, WhatsApp number, preferences
- `CustomerTag` - Segmentation labels
- `CustomerNote` - Internal observations

**Business Rules**:
- WhatsApp number is unique identifier
- Purchase history auto-populated from orders
- Quick reorder based on past purchases

**Key Services**:
- `CustomerService` - CRUD, search
- `CustomerHistoryService` - Purchase analytics
- `CustomerSegmentationService` - Tag management

### 4. Products Module

**Purpose**: Product catalog with categories and images.

**Key Entities**:
- `Product` - Core product info, pricing
- `ProductCategory` - Hierarchical categories
- `ProductImage` - Image references (stored in R2)
- `ProductVariant` - Size, color, etc. variations

**Business Rules**:
- Products can be active/inactive
- Variants share base product with specific SKUs
- Images uploaded to R2, URLs stored in DB

**Key Services**:
- `ProductService` - CRUD, search, filtering
- `ProductImageService` - Upload, resize, CDN URLs
- `ProductCatalogService` - Category management

### 5. Auth & Users Module

**Purpose**: Authentication and role-based access control.

**Roles**:
- `ADMIN` - Full system access
- `MANAGER` - Orders, inventory, customer management
- `OPERATOR` - Create orders, view customers

**Key Services**:
- `AuthService` - Login, token management
- `UserService` - User management
- `PermissionService` - RBAC enforcement

---

## Key Business Flows

### Order Capture Flow (WhatsApp)

```
Customer WhatsApp Message
         ↓
[Operator] Creates Draft Order
         ↓
[Operator] Adds Products (checks stock)
         ↓
[Operator] Confirms Order with Customer
         ↓
System: Reserve Stock → Create Movement
         ↓
Order Status: DRAFT → CONFIRMED
         ↓
Customer receives confirmation
```

### Order Fulfillment Flow

```
Order CONFIRMED
         ↓
[Manager/Operator] Processes order
         ↓
Order Status: CONFIRMED → PROCESSING
         ↓
[Operator] Prepares package
         ↓
Order Status: PROCESSING → SHIPPED
         ↓
[Operator] Delivers / hands to courier
         ↓
Order Status: SHIPPED → DELIVERED
         ↓
Stock reservation → committed sale
```

### Inventory Alert Flow

```
Stock Movement recorded
         ↓
Check if below threshold
         ↓
Yes → Queue BullMQ job
         ↓
AlertProcessor executes
         ↓
Create notification record
         ↓
Dashboard shows alert badge
```

---

## Database Architecture

### Schema Organization

```
┌─────────────────────────────────────────────────────┐
│  auth (users, roles, permissions)                   │
├─────────────────────────────────────────────────────┤
│  customers (profiles, tags, notes)                  │
├─────────────────────────────────────────────────────┤
│  products (catalog, categories, images, variants)     │
├─────────────────────────────────────────────────────┤
│  inventory (items, warehouses, movements)             │
├─────────────────────────────────────────────────────┤
│  orders (headers, items, status history)              │
└─────────────────────────────────────────────────────┘
```

### Critical Transactions

All stock-related operations use Prisma transactions:

```typescript
// Example: Confirm order with stock reservation
prisma.$transaction(async (tx) => {
  // 1. Update order status
  await tx.order.update({ ... });
  
  // 2. Reserve inventory
  await tx.inventoryItem.update({ 
    data: { reserved: { increment: quantity } }
  });
  
  // 3. Create stock movement
  await tx.stockMovement.create({ ... });
  
  // 4. Create status history
  await tx.orderStatusHistory.create({ ... });
});
```

---

## Queue Architecture (BullMQ + Redis)

### Job Types

| Queue | Job Type | Description |
|-------|----------|-------------|
| `inventory-alerts` | `LOW_STOCK` | Generate low stock notifications |
| `notifications` | `ORDER_STATUS` | Notify customers of order updates |
| `reports` | `DAILY_SUMMARY` | Generate daily sales reports |
| `exports` | `DATA_EXPORT` | CSV/Excel exports |

### Processor Pattern

```typescript
// Inventory alert processor
@Processor('inventory-alerts')
export class InventoryAlertProcessor {
  @Process('LOW_STOCK')
  async handleLowStock(job: Job<LowStockJobData>) {
    const { productId, warehouseId, currentStock } = job.data;
    
    // Create notification for managers
    await this.notificationService.create({
      type: 'LOW_STOCK',
      productId,
      message: `Stock bajo: ${product.name} (${currentStock} unidades)`
    });
  }
}
```

---

## API Design

### RESTful Endpoints

```
/api/v1
├── /auth
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
├── /customers
│   ├── GET / (list, search)
│   ├── POST / (create)
│   ├── GET /:id
│   ├── PATCH /:id
│   └── GET /:id/orders
├── /products
│   ├── GET / (list, filter)
│   ├── POST / (admin)
│   ├── GET /:id
│   └── PATCH /:id (admin)
├── /inventory
│   ├── GET / (stock levels)
│   ├── POST /adjustments (admin)
│   └── GET /movements
├── /orders
│   ├── GET / (list, filter)
│   ├── POST / (create draft)
│   ├── GET /:id
│   ├── PATCH /:id/status
│   └── POST /:id/items
└── /dashboard
    └── GET /metrics
```

### Swagger Documentation

Available at: `http://localhost:5007/api/docs`

---

## Frontend Architecture

### Next.js App Router Structure

```
front/src/app/
├── (auth)/
│   └── login/
├── (dashboard)/
│   ├── layout.tsx          # Dashboard shell with sidebar
│   ├── page.tsx            # Dashboard overview
│   ├── orders/
│   ├── customers/
│   ├── products/
│   ├── inventory/
│   └── settings/
└── api/                    # Next.js API routes (if needed)
```

### Key UI Components

- **OrderCard** - Visual order summary with status badge
- **OrderStatusTimeline** - Visual status progression
- **ProductStockIndicator** - Stock level with color coding
- **CustomerQuickView** - Customer info with recent orders
- **InventoryAlertBadge** - Alert indicator in navigation

### Responsive Design

- **Desktop**: Full sidebar, multi-column layouts
- **Tablet**: Collapsible sidebar, adjusted grids
- **Mobile**: Bottom navigation, single-column, touch-optimized

---

## Storage Architecture

### Image Storage (Cloudflare R2)

```
Bucket: sellflow-products/
├── products/
│   ├── {productId}/
│   │   ├── main.webp
│   │   └── thumb.webp
│   └── ...
└── customers/
    └── {customerId}/
        └── avatar.webp
```

### Upload Flow

1. Frontend requests signed upload URL from backend
2. Frontend uploads directly to R2 (bypassing backend)
3. Backend receives callback and stores image URL
4. Images served via Cloudflare CDN

---

## Security Model

### Authentication

- JWT access tokens (15 min TTL)
- JWT refresh tokens (7 day TTL, rotating)
- Secure HTTP-only cookies

### Authorization (RBAC)

| Resource | ADMIN | MANAGER | OPERATOR |
|----------|-------|---------|----------|
| Orders | All | All | View, Create |
| Customers | All | All | View, Create |
| Products | All | View | View |
| Inventory | All | View/Adjust | View |
| Users | All | - | - |
| Settings | All | - | - |

### Data Protection

- Row-level security for multi-tenant future
- Input sanitization
- SQL injection prevention (Prisma)
- XSS protection (Next.js built-in)

---

## Development Environment

### Ports (Strict)

| Service | Port | Variable |
|---------|------|----------|
| Frontend | 5006 | `FRONTEND_PORT` |
| Backend | 5007 | `BACKEND_PORT` |
| PostgreSQL | 5008 | `DATABASE_PORT` |
| Redis | 5009 | `REDIS_PORT` |

### Docker Services

- `postgres` - PostgreSQL 16
- `redis` - Redis 7
- `back` - NestJS API (production build)
- `front` - Next.js (production build)

### Local Development Commands

```bash
# Full stack (DB + apps)
npm run dev:stack

# Apps only (DB already running)
npm run dev:apps

# Database only
npm run dev:db

# Sync database schema
npm run db:sync
```

---

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────┐
│  Cloudflare (CDN + DNS + SSL)          │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Frontend Hosting (Vercel/Netlify)     │
│  - Next.js static + serverless          │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Backend Hosting (Railway/Fly.io)        │
│  - NestJS + PostgreSQL + Redis           │
└─────────────────────────────────────────┘
```

### Environment Variables

See `.env.example` for required variables per environment.

---

## Monitoring & Observability

### Health Checks

- `/api/health` - Basic liveness
- `/api/health/db` - Database connectivity
- `/api/health/redis` - Redis connectivity

### Logging

- Structured JSON logging in production
- Correlation IDs for request tracing
- Error tracking integration (Sentry recommended)

---

## Testing Strategy

### Backend (NestJS)

- Unit tests: Services, utilities
- Integration tests: API endpoints
- E2E tests: Critical business flows

### Frontend (Next.js)

- Component tests: UI components
- Integration tests: Page interactions
- E2E tests: Playwright for critical paths

---

## Roadmap Integration

### Phase 1 (Current)
- Core modules: Orders, Inventory, Customers, Products
- Web-based admin panel
- Manual WhatsApp workflow

### Phase 2
- WhatsApp Business API integration
- Automated customer notifications
- Click-to-order catalog links

### Phase 3
- Multi-tenant SaaS architecture
- Self-service onboarding
- Subscription management

---

*Last updated: April 2026*
*Technical Lead: Luis David Lopera*
