# Estrategia de tests (backend)

## Herramientas

- **Jest** (configuración del proyecto Nest por defecto).
- Archivos `*.spec.ts` junto al código o bajo `test/` si se añade estructura global.

## Unitarios

- **Casos de uso / servicios de dominio**: mockear puertos con objetos fake o `jest.fn()`.
- **No** levantar base de datos para unit tests.
- Ejemplo existente: `auth.service.spec.ts`, `payments.service.spec.ts`, `orders.service.spec.ts` — mantener el mismo estilo de mocks de `PrismaService`.

## Integración

- Opcional: módulo de test con `PrismaService` apuntando a base de datos de test (docker-compose o sqlite si el schema lo permite).
- Probar adapters de repositorio con datos reales mínimos.

## E2E

- `supertest` contra `AppModule` completo o módulo parcial.
- Cubrir flujos críticos: login, crear orden, webhook de pago (si aplica).
- No duplicar cobertura de cada DTO; centrarse en reglas de negocio y autorización.

## Qué no hace falta testear

- Cada línea de controller que solo delega.
- Getters de DTOs sin lógica.
- Código generado por Prisma.

## Comando

```bash
cd back && npm test
```

Tras refactor de carpetas, actualizar rutas en `jest` si se usan `moduleNameMapper`.
