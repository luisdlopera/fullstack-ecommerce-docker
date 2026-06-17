# NexStore Authentication Audit Report

## 1. Auditoría Completa del Flujo de Autenticación
El flujo actual utiliza un **Backend NestJS** y un **Frontend Next.js** (BFF - Backend For Frontend).

**Flujo de Login:**
1. El usuario envía credenciales desde el cliente (`/auth/login`).
2. El BFF de Next.js (`front/src/app/api/auth/login/route.ts`) recibe la petición POST.
3. El BFF reenvía la petición al backend en NestJS (`/api/auth/login`).
4. NestJS valida credenciales y genera un `accessToken` y un `refreshToken`.
5. **Punto crítico (Inconsistencia de Arquitectura)**: NestJS tiene una bandera de entorno `AUTH_COOKIES`. Si es `true`, NestJS configura una cookie `refreshToken` nativamente pero **omite** el `refreshToken` del cuerpo JSON de la respuesta.
6. El BFF de Next.js recibe la respuesta. Evalúa: `if (!payload.accessToken || !payload.refreshToken || !payload.user)`.
7. Si `AUTH_COOKIES=true` en NestJS, el BFF falla con error `502 Invalid auth response` porque no encuentra el `refreshToken` en el JSON.
8. Si no falla, el BFF configura dos cookies propias: `NEXSTORE_ACCESS_COOKIE` y `NEXSTORE_REFRESH_COOKIE` usando `applyAuthCookies()`.

## 2. Trazabilidad del Error
- **¿En qué punto exacto se rompe el login?** En el BFF del frontend: `front/src/app/api/auth/login/route.ts` en la validación del payload (`if (!payload.accessToken || !payload.refreshToken || !payload.user)`).
- **¿Qué está fallando realmente?** Cuando el backend (NestJS) se ejecuta con `AUTH_COOKIES=true` (lo cual es común o por defecto en algunos despliegues), el backend *secuestra* la cookie del refresh token y la quita del payload JSON. El BFF, esperando recibir ambos tokens en JSON para gestionar sus propias cookies, falla porque le falta un campo.
- **Evidencia**:
  - Código NestJS (`auth.controller.ts`): `if (process.env.AUTH_COOKIES === 'true') { response.cookie('refreshToken', ...); return { user: result.user, accessToken: result.accessToken }; }`
  - Código NextJS (`route.ts`): `if (!payload.accessToken || !payload.refreshToken || !payload.user) { return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 }); }`

## 3. Logs y Observabilidad
Se ha configurado la observabilidad usando las banderas `AUTH_DEBUG_LOGS=true` y `NEXT_PUBLIC_AUTH_DEBUG_LOGS=true`.
El código ya cuenta con prefijos `[AUTH-FRONT]` y `[AUTH-BACK]` y registran eventos clave como:
- `api login start`, `api login response`, `api login failed`, `api login invalid payload` (Frontend).
- `[AUTH-BACK] login hit`, `[AUTH-BACK] login response` (Backend).

## 4. Issues para GitHub

### 🔴 Crítico: El login falla con 502 Invalid auth response por inconsistencia de cookies

**Descripción:**
- **Contexto del problema:** El frontend usa Next.js como BFF (Backend-For-Frontend) y se encarga de definir las cookies de sesión (`NEXSTORE_ACCESS_COOKIE`, `NEXSTORE_REFRESH_COOKIE`). El backend en NestJS también tiene la capacidad de setear cookies directamente.
- **Qué está fallando:** Si el backend tiene la variable `AUTH_COOKIES=true`, devuelve el `refreshToken` vía Header `Set-Cookie` y lo elimina del body JSON. El BFF de Next.js espera ambos tokens en el JSON de respuesta. Al no encontrar el `refreshToken`, arroja un error 502 y el login falla.
- **Impacto:** Ningún usuario puede iniciar sesión en la plataforma.

**Pasos para reproducir:**
1. Ejecutar el backend con la variable `AUTH_COOKIES=true`.
2. Intentar hacer login desde el cliente web.
3. Observar la consola de Next.js mostrando un `[AUTH-FRONT] api login invalid payload`.
4. El cliente recibe un 502.

**Comportamiento esperado:**
El backend siempre debe retornar la carga útil completa en el JSON (`user`, `accessToken`, `refreshToken`) para que los clientes que actúan como proxy/BFF puedan procesar y setear las cookies bajo su propio dominio y reglas.

**Solución propuesta:**
En `back/src/modules/auth/infrastructure/http/auth.controller.ts`, modificar la lógica para que, incluso si `AUTH_COOKIES` es `true`, el `refreshToken` se incluya en el `return` object.

**Labels:** `auth`, `bug`, `critical`, `backend`

---

### 🟠 Flujo: La ruta /auth/session (Refresh) también tiene conflicto de payload

**Descripción:**
- **Contexto:** Igual que el login, el endpoint `/api/auth/refresh` en el backend NestJS tiene una condición similar.
- **Qué está fallando:** Si `AUTH_COOKIES=true`, omite el `refreshToken` renovado del payload JSON, lo que provocará que el BFF de Next.js (`front/src/app/api/auth/session/route.ts`) falle o borre la sesión al hacer `refreshTokens()`.

**Solución propuesta:**
Hacer la misma corrección que en `login`: devolver el `refreshToken` siempre en el cuerpo JSON en `auth.controller.ts` para el endpoint `refresh`.

**Labels:** `auth`, `bug`, `backend`
