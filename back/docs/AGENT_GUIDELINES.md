# Guías para agentes (backend NEXSTORE)

Este documento es obligatorio para cualquier cambio en `back/`.

## Arquitectura

- La estructura oficial es **hexagonal por módulo** bajo `src/modules/{feature}/` con capas `domain/`, `application/`, `infrastructure/`.
- Auditoría periódica, árbol de carpetas y deuda técnica: [BACKEND_AUDIT.md](./BACKEND_AUDIT.md).
- Código **transversal** (Prisma singleton, guards JWT, decorators `@Public` / `@CurrentUser`) vive en `src/shared/infrastructure/`.
- No añadas nuevas carpetas globales `src/domain`, `src/application`, `src/interfaces` salvo decisión explícita de arquitectura documentada en PR.

## Prohibido

- Importar **Prisma** o `@prisma/client` dentro de `domain/`.
- Poner **lógica de negocio** en controladores HTTP (solo adaptación request/response y delegación a casos de uso o servicios de aplicación).
- Hacer que **use cases** dependan de `Request`, `Response` o tipos de Express/Fastify.
- Mezclar **entidades de dominio** con **DTOs de validación** (class-validator) en el mismo archivo.
- Crear un `shared/` basura: solo utilidades realmente usadas por 2+ módulos.

## Obligatorio

- Un **Nest module** por feature (`{feature}.module.ts` junto al feature o en la raíz del módulo).
- **Imports**: preferir rutas relativas claras hacia `shared/` (p. ej. `../../../shared/infrastructure/prisma/prisma.service`).
- Nuevos endpoints: documentar contrato en `docs/API_CONVENTIONS.md` si cambian convenciones globales.
- Tras cambios estructurales: `npm run build` en `back/` debe pasar.

## Flujo de trabajo sugerido

1. Identificar el **módulo** afectado.
2. Colocar el cambio en la **capa correcta** (ver `ARCHITECTURE.md`).
3. Actualizar tests existentes o añadir tests según `TESTING.md`.
4. No romper el prefijo global `/api` configurado en `main.ts`.
