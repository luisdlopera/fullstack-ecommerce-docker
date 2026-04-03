# Título:
[AUTH] El login falla porque Next.js (BFF) espera un refreshToken en el JSON que NestJS no devuelve

# Descripción:
- **Contexto del problema:** En el flujo de autenticación actua Next.js Route Handler (`/api/auth/login`) como BFF (Backend for Frontend). Este recibe la respuesta de NestJS (`/auth/login`) y extrae los tokens `accessToken` y `refreshToken` para guardarlos en cookies httpOnly.
- **Qué está fallando:** Si en el backend de NestJS la variable de entorno `AUTH_COOKIES` está activada (`true`), NestJS intenta colocar el `refreshToken` directamente en una cookie (`response.cookie(...)`) y omite el `refreshToken` en el cuerpo de la respuesta JSON (retorna solo `{ user, accessToken }`). Cuando el BFF de Next.js recibe esta respuesta, falla en la validación `!payload.refreshToken` y devuelve un error 502 al frontend.
- **Evidencia (logs o comportamiento):** Al intentar loguearse, el frontend muestra un error "Error al iniciar sesión". En los logs del BFF (Next.js) aparece `[auth.login] invalid payload` indicando que faltan tokens.
- **Impacto:** Crítico. Rompe el inicio de sesión por completo en cualquier entorno donde `AUTH_COOKIES='true'` esté activo en el backend.

# Pasos para reproducir:
1. Configurar `AUTH_COOKIES=true` en el backend (NestJS).
2. Intentar loguearse desde el frontend (Next.js AuthPage).
3. Verificar la respuesta de la red: Next.js retorna 502 Bad Gateway.

# Comportamiento esperado:
El BFF de Next.js debería poder procesar el login. O bien, NestJS debe siempre retornar ambos tokens en el JSON independientemente de las cookies que intente setear, O la arquitectura debe delegar el manejo de cookies exclusivamente al BFF.

# Comportamiento actual:
NestJS no devuelve `refreshToken` en el JSON, lo que rompe la validación estricta del BFF de Next.js.

# Solución propuesta:
Eliminar la condicional en `auth.controller.ts` (NestJS) que omite `refreshToken` del objeto retornado. Siempre devolver `{ user, accessToken, refreshToken }` en el JSON para que cualquier cliente API/BFF pueda usarlo. Opcionalmente, quitar la lógica de cookies del backend ya que tenemos un BFF (Next.js).

# Checklist:
- [ ] Fix implementado
- [ ] Test agregado
- [ ] Validado manualmente

# Labels sugeridos:
- auth
- bug
- backend

# Prioridad:
- Critical