# Backend Overview

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | NestJS | 11.x |
| Language | TypeScript | 5.7.x |
| ORM | Prisma | 7.x |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis + BullMQ | 7 + 5.x |
| Storage | MinIO / R2 | Latest |
| Testing | Jest | 30.x |
| Auth | JWT + bcryptjs | — |

## Project Structure

```
back/
├── src/
│   ├── main.ts              # Bootstrap
│   ├── app.module.ts        # Root module
│   ├── shared/              # Cross-cutting concerns
│   │   ├── shared.module.ts
│   │   ├── domain/ports/     # Shared interfaces
│   │   └── infrastructure/   # Prisma, Auth, Storage
│   └── modules/             # Feature modules
│       ├── auth/
│       ├── users/
│       ├── products/
│       ├── inventory/
│       ├── orders/
│       ├── payments/
│       ├── admin/
│       └── health/
├── prisma/
│   ├── schema.prisma        # Data models
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Test data
└── docs/                    # Legacy (being migrated to .specify)
```

## Conventions

### File Naming

- **Files**: `kebab-case.ts` (e.g., `create-order.dto.ts`)
- **Classes**: `PascalCase` (e.g., `OrdersService`, `CreateOrderDto`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `PRODUCT_REPOSITORY`)

### Folder Structure per Module

```
modules/{feature}/
├── domain/
│   ├── entities/
│   └── ports/
├── application/
│   ├── use-cases/
│   └── {feature}.service.ts
├── infrastructure/
│   ├── http/
│   │   ├── {feature}.controller.ts
│   │   └── dto/
│   └── persistence/
└── {feature}.module.ts
```

### DTOs

- HTTP DTOs (body/query) use `class-validator` decorators
- Located in `infrastructure/http/dto/`
- `ValidationPipe` is global in `main.ts`

### Repositories

- Port (interface) in `domain/repositories/`
- Adapter (Prisma) in `infrastructure/persistence/`
- Registration in module:
  ```typescript
  {
    provide: PRODUCT_REPOSITORY,
    useClass: PrismaProductRepository,
  }
  ```

### Error Handling

Use NestJS exceptions:
- `NotFoundException` - Resource not found
- `BadRequestException` - Validation failed
- `UnauthorizedException` - Auth required
- `ForbiddenException` - Insufficient permissions

Messages should be consistent with module language (Spanish for business errors).

### Guards & Roles

- `@Public()` - Skip JWT validation
- `@Roles(...)` + `RolesGuard` - Role-based access
- Permissions centralized in `shared/infrastructure/auth/permissions.ts`

### Imports

- No path aliases (`@/`) in backend
- Use relative paths: `../../shared/infrastructure/prisma/prisma.service`

## Key Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Development with hot reload (tsx watch) |
| `npm run build` | Production TypeScript compile |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Jest watch mode |
| `npm run prisma:migrate:dev` | Create migration |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:seed` | Seed test data |
| `npm run lint` | ESLint fix |
| `npm run format` | Prettier format |

## Module Template

When creating new modules, follow the [hexagonal architecture pattern](./hexagonal-backend.md):

1. Create folder structure with `.gitkeep` in empty folders
2. Define repository port in `domain/ports/`
3. Create use case in `application/use-cases/`
4. Implement Prisma adapter in `infrastructure/persistence/`
5. Create controller in `infrastructure/http/`
6. Register in module with port binding

See also: [Module Template](./module-template.md) (if exists separately)

## External Integrations

### MercadoPago

- Used for payment processing in Colombia
- Webhook handling for async confirmations
- Configuration: `MP_ACCESS_TOKEN`

### Email (Resend)

- Transactional emails
- Configuration: `RESEND_API_KEY` (future)

## Development Guidelines

### Adding a Feature

1. Identify the affected module
2. Place logic in correct layer (domain → application → infrastructure)
3. Update or add tests
4. Ensure `npm run build` passes
5. Verify no breaking changes to `/api` prefix

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Generate client: `npx prisma generate`
4. Update seed if needed
5. Commit migration files

### Testing

- Mock ports in unit tests (no database needed)
- Use integration tests for Prisma adapters
- E2E tests for critical flows (login, checkout, webhooks)

## References

- [Architecture Overview](../architecture/hexagonal-backend.md)
- [Service Boundaries](../architecture/service-boundaries.md)
- [Prisma Models](./prisma-models.md)
- [API Reference](./api-reference.md)
