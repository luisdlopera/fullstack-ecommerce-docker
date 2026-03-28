# Convenciones y reglas — Frontend Nexstore

Stack: **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **HeroUI**, **Vitest**, **Playwright**.

---

## 1. Estructura de `src/`

### `app/`

- Rutas y layouts del App Router (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
- **Rutas API de Next** (BFF): `app/api/auth/*`, `app/api/bff/[[...path]]`. No mezclar lógica de negocio aquí: solo proxy, cookies y shaping mínimo de respuesta.
- Por defecto los archivos son **Server Components**. Añade `'use client'` solo en páginas o subárboles que usen estado, efectos o eventos del DOM.

### `features/`

- Código **por dominio funcional** (collection, product-detail, cart, checkout, admin, catalog, product).
- Cada feature suele incluir:
    - `components/` — UI y piezas reutilizables dentro del feature (a menudo con carpeta por componente + `index.ts`).
    - `hooks/` — lógica de estado y efectos ligados al feature.
    - `lib/` — utilidades puras (filtros, mapeo API → vista, URLs).
    - `context/` o `contexts/` — cuando el feature expone estado global (ej. carrito).
    - `services/` — cliente HTTP específico del feature (ej. `admin-api.ts`).
    - `types/` — tipos solo del admin u otros módulos grandes.
- Exportar lo público del feature desde `features/<name>/index.ts` (barrel). Evita importar archivos internos profundos desde fuera del feature salvo necesidad.

### `components/`

- UI **transversal**: layout (Header, Footer, LayoutShell), providers, sliders, tabs home, grids genéricos.
- `components/shared/` — piezas compartidas entre varias features (ej. `product-card/` en **kebab-case**).
- No duplicar carpetas con el mismo propósito (un solo árbol de “card” compartida).

### `contexts/`

- Contextos React globales de la app (`AuthContext`, `FavoritesContext`).
- Deben vivir en el árbol bajo `app/layout.tsx` (ya provistos por `AuthProvider`, etc.).

### `lib/`

- Utilidades **sin UI**: `api.ts` (fetch servidor + cliente público), `shop-api.ts`, `bff-fetch.ts`, formateo, flags de producto, mocks de desarrollo.
- Contratos compartidos con el backend: tipos reexportados desde `@nexstore/api-types` donde aplique.

### `schemas/`

- Esquemas **Zod** (validación de formularios, sobre todo admin).

### `test/`

- Configuración o tests de setup compartidos (ej. RTL).

---

## 2. Datos y capa HTTP

### Variables de entorno

| Variable              | Uso                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base del API Nest **en el navegador** (debe incluir el sufijo `/api`). Catálogo público, `shopFetch`, etc.                                      |
| `INTERNAL_API_URL`    | Misma base pero para **Route Handlers** y Server Components en Docker/servidor (ej. `http://back:4000/api`). Prioritaria en servidor si existe. |

### Tres formas de hablar con el backend

1. **Servidor (RSC, `generateMetadata`, fetch con caché)** — `getBaseApiUrl()` en `lib/api.ts`: `getFeaturedProducts`, `getProductBySlug`, `getProductBySlugOrNull`, `getProducts`, etc., con `next: { revalidate: … }` cuando corresponda.
2. **Cliente, endpoints públicos** — `getClientApiUrl()` + `shopFetch` / helpers en `shop-api.ts` (sin cookies de sesión).
3. **Cliente o flujos autenticados** — `bffFetch('/ruta-relativa-al-api')` → `/api/bff/...`, que reenvía a Nest con el JWT en **cookie httpOnly** (`nexstore_access`). Usado en: admin, pedidos, cuenta (dirección), checkout (crear orden).

### Auth

- Login/registro pasan por **`/api/auth/login`** y **`/api/auth/register`**: el body va al Nest y las cookies se fijan en la respuesta Next.
- Sesión: **`GET /api/auth/session`** (hidratación de usuario + refresh si hace falta).
- Logout: **`POST /api/auth/logout`**.
- No guardar access/refresh token en `localStorage`. El estado `user` vive en memoria (`AuthContext`).

### Tipos compartidos

- Paquete workspace **`@nexstore/api-types`**: `Product`, `ProductListResponse`, `ProductFacets`, `ProductFilters`, etc.
- `lib/api.ts` reexporta esos tipos y centraliza query params (`appendProductFiltersToSearchParams`) para alinear PLP/facetas con el backend.

---

## 3. Componentes y responsabilidad

- **Un componente, una responsabilidad principal.** Si un archivo supera ~200–250 líneas de UI, extraer subcomponentes o hooks.
- **Props tipadas** con interfaces o tipos explícitos; evitar `any` (ESLint: `no-explicit-any` en warn).
- Componentes de lista/detalle que dependan del carrito, favoritos o auth deben ser **client components** o recibir callbacks desde el cliente.
- PDP: la página en `app/products/[slug]/page.tsx` es servidor; la interacción (tallas, carrito, favoritos) vive en `features/product-detail/ProductDetailPageClient.tsx`.

---

## 4. Estilos y UI

- **Tailwind** utility-first; clases en el JSX coherente con el resto del archivo (orden legible: layout → spacing → tipografía → color).
- **HeroUI** para formularios, botones, modales donde ya se usa en el proyecto; no mezclar otro sistema de componentes sin acuerdo.
- Textos de interfaz orientados al **español** para el usuario final (mensajes, labels, toasts).

---

## 5. Rutas y navegación

- Colecciones dinámicas: `app/[collection]/`.
- Admin bajo `/admin/*` con layout propio (sin Header/Footer del shop: `LayoutShell` lo omite).
- URLs del catálogo deben seguir siendo **compartibles**: filtros reflejados en query params (ver `features/collection/lib/catalog-url.ts` y hooks asociados).

---

## 6. Testing

| Tipo                      | Herramienta | Ubicación típica                           |
| ------------------------- | ----------- | ------------------------------------------ |
| Unit / integración ligera | Vitest      | Junto al código: `*.test.ts`, `*.test.tsx` |
| E2E                       | Playwright  | `e2e/*.spec.ts`, `npm run test:e2e`        |

- Preferir tests de **lib pura** (filtros, URLs, mapeos) y componentes con **Testing Library**.
- E2E: `playwright.config.ts` levanta `npm run dev`; no asumir API real salvo que el entorno lo provea.

---

## 7. Calidad y DX

- **Alias de imports:** `@/` → `src/` (ver `tsconfig.json`).
- **Formato:** Prettier; **lint:** `npm run lint` (ESLint Next + TypeScript).
- Commits y mensajes alineados con las reglas del repo (en inglés si el equipo así lo definió).
- No añadir dependencias sin necesidad; el monorepo usa **npm workspaces** (`front`, `back`, `packages/*`).

---

## 8. Checklist rápido al añadir una feature

1. ¿Va en `features/<nombre>` con barrel `index.ts`?
2. ¿Los datos públicos usan `api.ts` / `shop-api` y los autenticados `bffFetch`?
3. ¿Los tipos de contrato existen en `@nexstore/api-types` o deben añadirse allí?
4. ¿Server vs client está justificado (`'use client'` solo donde haga falta)?
5. ¿Hay test mínimo en `lib` o componente crítico si la lógica es frágil?

---

## 9. Referencias en el repo

- `back/docs/BACKEND_AUDIT.md` — rutas API y módulos Nest.
- `front/.env.example` — variables esperadas.
- `front/playwright.config.ts` — E2E.
- `packages/api-types` — DTOs compartidos storefront ↔ API.
