# Reglas de implementación (backend)

## Nombres

- Archivos: `kebab-case` para no coincidir con clases (`create-order.dto.ts`).
- Clases: `PascalCase` (`OrdersService`, `CreateOrderDto`).
- Constantes de inyección: `SCREAMING_SNAKE` o `Symbol` para tokens (`PRODUCT_REPOSITORY`).

## Carpetas por módulo

- `infrastructure/http/` — controllers (opcional si pocos archivos en raíz de infrastructure).
- `infrastructure/persistence/` — implementaciones Prisma de puertos.
- `application/use-cases/` — un archivo por caso de uso cuando aplique.
- `application/dto/` — DTOs que no son exclusivos de HTTP (si aplica).
- `domain/` — entidades y **ports** (interfaces) sin dependencias de framework.

## DTOs

- **HTTP DTOs** (body/query con `class-validator`): junto al controller o en `infrastructure/dto/`.
- Validación con `class-validator` + `ValidationPipe` global en `main.ts`.
- No devolver entidades Prisma crudas si el contrato público debe ser estable; mapear a respuesta explícita cuando el proyecto crezca.

## Repositorios

- Puerto (interface) en `domain/repositories/` o `application/ports/`.
- Adapter Prisma en `infrastructure/persistence/`.
- Registro: `{ provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository }` en el module del feature.

## Errores

- Usar excepciones Nest: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, etc.
- Mensajes en español o inglés de forma **consistente** con el módulo existente.

## Guards y roles

- `@Public()` para rutas sin JWT.
- `@Roles(...)` + `RolesGuard` para admin.
- Permisos centralizados en `shared/infrastructure/auth/permissions.ts`.

## Imports

- `baseUrl` en `tsconfig` es `./`; no hay alias `@/` en el back: usar rutas relativas.
- Desde `modules/orders/orders.service.ts` hacia Prisma: `../../shared/infrastructure/prisma/prisma.service`.
