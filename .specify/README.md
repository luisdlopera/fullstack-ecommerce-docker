# Nexstore Documentation Index

## Quick Start

Welcome to the Nexstore `.specify` documentation system. This is the single source of truth for the full-stack ecommerce platform.

## Documentation Structure

```
.specify/
├── product/              # Business goals, target market
├── architecture/         # System design, patterns
├── backend/              # API, modules, database
├── frontend/             # Next.js, UI, auth
├── infrastructure/       # Docker, services, config
├── testing/              # Testing strategy
├── security/             # Auth, RBAC, best practices
├── decisions/            # ADRs, tech choices
└── flows/                # User flows, processes
```

## Key Documents by Role

### For New Developers

1. Start here: [Architecture Overview](architecture/system-design.md)
2. Setup: [Monorepo Structure](architecture/monorepo-structure.md)
3. Backend: [Backend Overview](backend/overview.md)
4. Frontend: [Frontend Overview](frontend/overview.md)
5. Infrastructure: [Docker Services](infrastructure/docker-services.md)

### For Backend Developers

- [Hexagonal Architecture](architecture/hexagonal-backend.md)
- [API Reference](backend/api-reference.md)
- [Prisma Models](backend/prisma-models.md)
- Module docs:
  - [Auth](backend/modules/auth.md)
  - [Products](backend/modules/products.md)
  - [Inventory](backend/modules/inventory.md)
  - [Orders](backend/modules/orders.md)

### For Frontend Developers

- [App Router](frontend/app-router.md)
- [Auth Flow](frontend/auth-flow.md)
- [UI System](frontend/ui-system.md)
- API Integration: [BFF Pattern](frontend/auth-flow.md#bff-integration)

### For DevOps/Infrastructure

- [Docker Services](infrastructure/docker-services.md)
- [Port Allocation](infrastructure/ports.md)
- [Environment Variables](infrastructure/environment-vars.md)
- [Redis & BullMQ](infrastructure/redis-bullmq.md)
- [MinIO Storage](infrastructure/minio-storage.md)

### For Product Managers

- [Product Overview](product/overview.md)
- [Target Market](product/target-market.md)
- [Checkout Flow](flows/checkout.md)
- [Architecture Decisions](decisions/architecture-decisions.md)

## System Overview

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, HeroUI |
| Backend | NestJS 11, Prisma 7, PostgreSQL 16 |
| Infrastructure | Docker, Redis, BullMQ, MinIO |
| Testing | Vitest, Jest, Playwright |

### Architecture

- **Monorepo**: npm workspaces with `front/`, `back/`, `packages/`
- **Backend**: Hexagonal architecture with domain/application/infrastructure layers
- **Frontend**: Next.js App Router with BFF pattern for auth
- **Ports**: Standardized 5000+ range (5000 frontend, 5001 backend, etc.)

### Key Features

- JWT authentication with httpOnly cookies
- RBAC with 5 role levels
- Multi-warehouse inventory management
- BullMQ for async processing
- MercadoPago integration (Colombia)
- Image upload to MinIO/R2

## Critical Flows

1. [User Login](flows/user-login.md) - JWT + cookies
2. [Checkout](flows/checkout.md) - Order creation to payment
3. [Image Upload](flows/image-upload.md) - Admin product images
4. [Inventory Update](flows/inventory-update.md) - Stock movements

## Development Commands

```bash
# Install dependencies
npm install

# Start development (DB + apps)
npm run dev:stack

# Start apps only (DB running)
npm run dev:apps

# Database operations
npm run db:sync        # Generate + migrate
npm run prisma:seed -w back

# Testing
npm test -w back
npm run test:e2e -w front
```

## URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5000 |
| API | http://localhost:5001/api |
| Swagger | http://localhost:5001/api/docs |
| Health | http://localhost:5001/api/health |
| MinIO Console | http://localhost:5005 |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexstore.com | Qwert.12345 |
| Customer | cliente@nexstore.com | Qwert.12345 |

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Branch naming conventions
- Commit message format
- PR checklist
- Code style guidelines

## Migration Status

This `.specify` documentation replaces and consolidates:
- `/docs` folders (back/docs, front/docs)
- README technical sections
- Scattered inline documentation

All documentation is now AI-friendly with:
- Clear headings and structure
- Cross-references between docs
- Code snippets and examples
- Tables for structured data

## Need Help?

- Check the [Architecture Overview](architecture/system-design.md)
- Review [Backend Rules](backend/overview.md)
- See [API Reference](backend/api-reference.md)
- Check [Environment Variables](infrastructure/environment-vars.md)

---

*Last updated: Documentation migration complete*
