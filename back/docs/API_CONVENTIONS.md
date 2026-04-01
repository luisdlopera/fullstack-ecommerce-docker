# Convenciones de API (REST)

## Prefijo global

- Todas las rutas bajo **`/api`**, configurado en `main.ts` con `app.setGlobalPrefix('api')`.
- Versionado por URI habilitado: **`/api/v1`** es el prefijo recomendado.
- Por compatibilidad, **`/api/*`** sin versión se reescribe a **`/api/v1/*`** (excepto Swagger en `/api/docs`).
- El cliente público puede usar `NEXT_PUBLIC_API_URL` apuntando a `http://host:port/api` o `http://host:port/api/v1`.

## Nombres y recursos

- Plural para colecciones: `/products`, `/orders`, `/users`.
- Subrecursos cuando tenga sentido: `/products/:slug`, `/products/:slug/stock`.
- Admin bajo `/admin/...` con guards de rol (ver `admin.controller.ts`).

## Métodos HTTP

- `GET` lectura, `POST` creación, `PATCH`/`PUT` actualización parcial/total según el módulo.
- `DELETE` solo si está implementado de forma segura.

## Status codes

- `200` OK con cuerpo.
- `201` Created en creación explícita (si se adopta).
- `400` validación fallida (ValidationPipe).
- `401` no autenticado (JWT).
- `403` sin permisos (RolesGuard).
- `404` recurso no encontrado (`NotFoundException`).

## Errores

- Nest devuelve JSON con `statusCode`, `message`, y opcionalmente `error`.
- Mensajes consistentes con el idioma del resto del endpoint.

## Paginación y listados

- Query: `page`, `limit` (máximo razonable enforced en servicio, p. ej. 100).
- Respuesta lista con envoltorio `{ data, meta: { page, limit, total, totalPages } }` como en `GET /products`.

## Filtros (productos)

- CSV o query params documentados: `mustTag`, `anyTags`, `sizes`, `colors`, `categories`, `colSlugs`, `classifications`, `avail`, `query`, `gender`, `minPrice`, `maxPrice`, `inStock` (legacy), etc.
- Mantener compatibilidad hacia atrás cuando se añadan parámetros.

## Autenticación

- Header `Authorization: Bearer <access_token>` para rutas protegidas.
- `@Public()` en rutas explícitamente abiertas (health, productos públicos, auth login/register).

## Versionado

- `v1` es la versión actual activa.
- Nuevas versiones deben agregarse con prefijo `/api/v2` y mantener compatibilidad en `v1`.
