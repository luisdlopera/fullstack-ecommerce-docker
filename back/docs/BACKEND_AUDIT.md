# Auditoría backend Nexstore (NestJS + Prisma)

Última revisión: alineación con arquitectura hexagonal por módulo y contrato con el frontend.

## 1. Estado actual (post-refactor)

### 1.1 Estructura consistente

Cada feature bajo `src/modules/{feature}/` incluye:

- `domain/` — puertos y modelos sin framework (ej. `products/domain/ports/product-repository.port.ts`).
- `application/` — casos de uso y, donde aún no se han partido, **application services** que orquestan Prisma (users, admin).
- `infrastructure/http/` — controladores Nest y DTOs de entrada HTTP (`dto/`).
- `infrastructure/persistence/` — adaptadores Prisma cuando existen (products).

`src/shared/` agrupa Prisma global, guards JWT/Roles y decorators (`shared/infrastructure/`), más `shared/domain` y `shared/application` reservados para piezas transversales reales (actualmente vacíos salvo `.gitkeep`).

### 1.2 Inconsistencias resueltas en esta pasada

| Antes | Después |
|-------|---------|
| `ProductsService` con toda la lógica de catálogo y Prisma | Puerto `ProductRepositoryPort` + `PrismaProductRepository` + use cases (`ListProducts`, `GetProductBySlug`, etc.) |
| `AuthService`, `UsersService`, … en la raíz del módulo mezclados con controllers | `application/*.service.ts` + `infrastructure/http/*.controller.ts` + `infrastructure/http/dto/` |
| Puerto de producto solo para `findFeatured` | Puerto único para featured, listado, detalle, stock, categorías y países |

### 1.3 Deuda técnica explícita (aceptada)

- **Use cases vs services**: `AdminService` sigue siendo clase `@Injectable()` con acceso directo a `PrismaService`; los endpoints admin ahora pasan por **use cases** que delegan en esa fachada. La evolución es extraer puertos y separar acceso a datos por agregado (ver §3).
- **Excepciones HTTP en use cases**: `GetProductBySlugUseCase` y `GetProductStockBySlugUseCase` lanzan `NotFoundException` de Nest. Mejor: errores de dominio + filtro/mapper en HTTP (documentado en `ARCHITECTURE.md`).

---

## 2. Comparación backend ↔ frontend

Prefijo global: `/api` (`main.ts`). El frontend usa `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL` apuntando a `…/api`.

| Ruta (relativa a `/api`) | Backend | Consumidor front |
|--------------------------|---------|-------------------|
| `GET /products/featured` | `ProductsController` → `GetFeaturedProductsUseCase` | `getFeaturedProducts` en `front/src/lib/api.ts` |
| `GET /products` (+ query filters) | `ListProductsUseCase` | `fetchProducts` / listado catálogo |
| `GET /products/:slug` | `GetProductBySlugUseCase` | PDP, `getProductBySlug`, `shopFetch` |
| `GET /products/:slug/stock` | `GetProductStockBySlugUseCase` | Si el front lo usa |
| `GET /categories` | `ListCategoriesUseCase` | `getCategories` |
| `GET /countries` | `ListCountriesUseCase` | `getCountries`, cuenta, checkout |
| `POST /auth/login`, `register`, `refresh`, `GET /auth/me`, `POST /auth/logout` | `AuthController` + use cases | `AuthContext`, `shopFetch` |
| `GET/PUT/DELETE /users/me/address` | `UsersController` + use cases | `account/page.tsx` |
| `POST /orders`, `GET /orders`, … | `OrdersController` + use cases | checkout, `orders/*` |
| `POST /payments/mercadopago/*` | `PaymentsController` + use cases | flujo pago |
| `GET/PATCH/POST /admin/*` | `AdminController` + use cases (delegan en `AdminService`) | `features/admin/services/admin-api.ts` |

**Contrato JSON**: el listado y el detalle de producto devuelven la misma forma que antes (`ProductImage`, `category`, `meta` en listados). Los tipos en `front/src/lib/api.ts` (`Product`, `ProductListResponse`, `Country`, etc.) siguen siendo la referencia de compatibilidad.

---

## 3. Services candidatos a reemplazar por use-cases (prioridad)

1. **AdminService** — mayor superficie; dividir por subdominio y extraer repositorios/puertos.

**Products**: el antiguo `ProductsService` fue eliminado; el catálogo público pasa por use cases + repositorio.

---

## 4. Árbol final (referencia)

```
src/
  app.module.ts
  main.ts
  shared/
    shared.module.ts
    domain/.gitkeep
    application/.gitkeep
    infrastructure/
      prisma/prisma.service.ts
      auth/   # guards, decorators, jwt-payload, permissions
  modules/
    auth/
      domain/ports/*.ts
      application/auth.service.ts, auth.service.spec.ts
      infrastructure/http/auth.controller.ts, dto/*.ts
      infrastructure/persistence/prisma-auth.repository.ts
      infrastructure/security/jwt-token.service.ts
      auth.module.ts
    users/
      domain/ports/*.ts
      application/use-cases/*.use-case.ts
      infrastructure/http/users.controller.ts, dto/*.ts
      infrastructure/persistence/prisma-users.repository.ts
      users.module.ts
    products/
      domain/ports/product-repository.port.ts
      application/use-cases/*.use-case.ts
      infrastructure/http/*.controller.ts
      infrastructure/persistence/prisma-product.repository.ts
      products.module.ts
    orders/
      domain/
      application/use-cases/*.use-case.ts
      infrastructure/http/orders.controller.ts, dto/*.ts
      orders.module.ts
    payments/
      domain/
      application/use-cases/*.use-case.ts
      infrastructure/http/payments.controller.ts, dto/*.ts
      payments.module.ts
    admin/
      domain/
      application/admin.service.ts
      application/use-cases/*.use-case.ts
      infrastructure/http/admin.controller.ts, dto/*.ts
      admin.module.ts
    health/
      domain/
      health.module.ts
      infrastructure/http/health.controller.ts
```

---

## 5. Validación

- `cd back && npm run build` — compilación TypeScript.
- `cd back && npm test` — tests unitarios existentes (auth, users controller).

---

## 6. Próximo paso recomendado

1. Introducir puertos + use cases en **admin** (superficie mayor).
3. Sustituir `NotFoundException` en use cases de products por error de dominio + `ExceptionFilter` o mapeo en controller.
4. Path aliases `@modules/*`, `@shared/*` (opcional) y reglas en `BACKEND_RULES.md`.
