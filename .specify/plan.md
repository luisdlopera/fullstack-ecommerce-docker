# Technical Plan: Smart Inventory System

## Stack
- Backend: NestJS (Hexagonal Architecture)
- DB: PostgreSQL (Prisma)
- Queue: BullMQ + Redis
- Auth: JWT + RBAC

## Modules

### Inventory Module
- inventory.service.ts
- inventory.controller.ts
- inventory.repository.ts

### Product Module
- product.entity
- product.service

### Warehouse Module
- warehouse.entity
- warehouse.service

### Stock Movement Module
- stock-movement.entity
- stock-movement.service

### Alert Module
- alert.service
- queue processor (BullMQ)

## Core Entities

### Product
- id
- name
- sku

### Warehouse
- id
- name
- location

### Inventory
- id
- productId
- warehouseId
- stock

### StockMovement
- id
- type (IN | OUT)
- quantity
- reference
- createdAt

## Key Flows

### Order Created
→ reduce stock
→ create stock movement
→ validate stock availability

### Order Cancelled
→ restore stock
→ create reverse movement

### Low Stock
→ push job to queue
→ send notification

## Architecture
- Domain layer: entities + business logic
- Application layer: use cases
- Infrastructure: Prisma + controllers

## Transactions
- Use Prisma transactions for stock updates
- Prevent race conditions

## Security
- RBAC per role:
  - Admin: full access
  - Inventory Manager: limited
