# Prisma Models

## Overview

Database schema using Prisma ORM with PostgreSQL. Schema location: `back/prisma/schema.prisma`

## Enums

```prisma
enum Size {
  XS S M L XL XXL XXXL
}

enum Gender {
  men women kid unisex
}

enum Role {
  SUPER_ADMIN ADMIN MANAGER SUPPORT CUSTOMER
}

enum OrderStatus {
  PENDING PAID PROCESSING SHIPPED DELIVERED CANCELLED REFUNDED
}

enum PaymentStatus {
  PENDING PAID FAILED REFUNDED
}

enum InventoryMovementType {
  IN OUT ADJUSTMENT TRANSFER RESERVE RELEASE COMMIT
}
```

## Core Entities

### User

Central user entity with role-based access.

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  password      String    // bcrypt hashed
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  role          Role      @default(CUSTOMER)
  image         String?
  phone         String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?

  addresses            UserAddress[]
  orders               Order[]
  refreshTokens        RefreshToken[]
  passwordResetTokens  PasswordResetToken[]
  favorites            UserFavorite[]
  stockMovements       StockMovement[]  // Audit trail

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}
```

### Product

Product catalog with category relationship.

```prisma
model Product {
  id           String   @id @default(uuid())
  title        String
  description  String
  sku          String?  @unique
  inStock      Int      // Legacy field (replaced by Inventory)
  price        Float    @default(0)
  comparePrice Float?
  sizes        Size[]   @default([])
  slug         String   @unique
  tags         String[] @default([])
  gender       Gender
  featured     Boolean  @default(false)
  isActive     Boolean  @default(true)

  category   Category @relation(fields: [categoryId], references: [id])
  categoryId String

  images          ProductImage[]
  orderItems      OrderItem[]
  favorites       UserFavorite[]
  inventories     Inventory[]
  stockMovements  StockMovement[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([gender])
  @@index([categoryId])
  @@index([isActive])
}
```

### Category

Hierarchical product categories.

```prisma
model Category {
  id          String  @id @default(uuid())
  name        String  @unique
  slug        String  @unique
  description String?
  image       String?
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)

  parentId String?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([parentId])
  @@index([isActive])
}
```

### Order & OrderItem

Order management with item breakdown.

```prisma
model Order {
  id            String        @id @default(uuid())
  subTotal      Float
  tax           Float
  total         Float
  itemsInOrder  Int
  isPaid        Boolean       @default(false)
  paidAt        DateTime?
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  internalNotes String?

  user   User?   @relation(fields: [userId], references: [id])
  userId String?

  guestEmail         String?
  guestCheckoutToken String? @unique

  items    OrderItem[]
  address  OrderAddress?
  transactionId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
}

model OrderItem {
  id       String @id @default(uuid())
  quantity Int
  price    Float  // Price at time of order
  size     Size

  order   Order  @relation(fields: [orderId], references: [id])
  orderId String

  product   Product @relation(fields: [productId], references: [id])
  productId String
}
```

### Inventory System

Granular stock management with multi-warehouse support.

```prisma
model Warehouse {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  location    String?
  isActive    Boolean  @default(true)

  inventories            Inventory[]
  stockMovements         StockMovement[] @relation("StockMovementWarehouse")
  stockMovementsSource   StockMovement[] @relation("StockMovementSourceWarehouse")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
}

model Inventory {
  id                 String   @id @default(uuid())
  availableQuantity  Int      @default(0)
  reservedQuantity   Int      @default(0)
  lowStockThreshold  Int      @default(5)
  allowNegativeStock Boolean  @default(false)

  product   Product  @relation(fields: [productId], references: [id])
  productId String
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  warehouseId String

  movements StockMovement[]

  @@unique([productId, warehouseId])
  @@index([productId])
  @@index([warehouseId])
  @@index([availableQuantity])
}

model StockMovement {
  id                String                @id @default(uuid())
  type              InventoryMovementType
  quantity          Int
  reference         String?  // Order ID, adjustment ID
  note              String?

  inventory   Inventory  @relation(fields: [inventoryId], references: [id])
  inventoryId String
  product     Product    @relation(fields: [productId], references: [id])
  productId   String
  warehouse   Warehouse  @relation("StockMovementWarehouse", fields: [warehouseId], references: [id])
  warehouseId String
  sourceWarehouse Warehouse? @relation("StockMovementSourceWarehouse", fields: [sourceWarehouseId], references: [id])
  sourceWarehouseId String?
  user        User?      @relation(fields: [userId], references: [id])
  userId      String?

  createdAt DateTime @default(now())

  @@index([productId])
  @@index([warehouseId])
  @@index([inventoryId])
  @@index([type])
  @@index([reference])
  @@index([createdAt])
}
```

### Product Images

Image metadata with storage provider abstraction.

```prisma
model ProductImage {
  id              Int      @id @default(autoincrement())
  url             String
  storageProvider String?  // minio, r2, s3
  storageKey      String?  @unique
  contentType     String?  // image/jpeg, image/webp
  sizeBytes       Int?
  altText         String?
  sortOrder       Int      @default(0)
  isPrimary       Boolean  @default(false)

  product   Product @relation(fields: [productId], references: [id])
  productId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId, sortOrder])
  @@index([productId, isPrimary])
}
```

### Authentication

Refresh token tracking for JWT rotation.

```prisma
model RefreshToken {
  id            String    @id @default(uuid())
  token         String    @unique
  tokenHash     String?   @unique
  jti           String?   @unique
  familyId      String?
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt     DateTime
  revokedAt     DateTime?
  replacedByJti String?
  userAgentHash String?
  ipHash        String?

  createdAt     DateTime  @default(now())
  lastUsedAt    DateTime  @default(now())

  @@index([userId])
  @@index([familyId])
  @@index([expiresAt])
}
```

## Entity Relationships

```
User 1:N UserAddress
User 1:N Order
User 1:N RefreshToken
User N:M Product (favorites)

Category 1:N Category (self, tree)
Category 1:N Product

Product 1:N ProductImage
Product 1:N OrderItem
Product 1:N Inventory
Product 1:N StockMovement

Order 1:N OrderItem
Order 1:1 OrderAddress
Order N:1 User (optional, guest checkout)

Warehouse 1:N Inventory
Warehouse 1:N StockMovement

Inventory N:1 Product
Inventory N:1 Warehouse
Inventory 1:N StockMovement
```

## Indexes

All indexes follow query patterns:
- Foreign keys: always indexed
- Slugs/unique codes: indexed
- Active flags: indexed for filtering
- Timestamps: indexed for sorting
- Composite: unique constraints enforced

## Migrations

Create new migration:
```bash
cd back
npx prisma migrate dev --name <description>
```

Apply to production:
```bash
npx prisma migrate deploy
```

## Seed Data

Seed script: `back/prisma/seed.ts`

Test accounts:
- `admin@nexstore.com` / `Qwert.12345`
- `cliente@nexstore.com` / `Qwert.12345`

Run seed:
```bash
npx prisma db seed
```
