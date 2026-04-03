# Título:
[AUTH] Acoplamiento de arquitectura: Next.js y NestJS colisionan al intentar setear Cookies de Autenticación

# Descripción:
- **Contexto del problema:** Tenemos una arquitectura Frontend (Next.js) -> BFF (Next.js Route Handlers) -> Backend API (NestJS). La responsabilidad de mantener la sesión web recae en el BFF mediante cookies httpOnly.
- **Qué está fallando:** El backend de NestJS todavía contiene lógica fuertemente acoplada a la web para setear y leer cookies (`req.cookies.refreshToken`, `res.cookie('refreshToken')`), controlada mediante la variable `AUTH_COOKIES`. Esto es problemático en arquitecturas BFF / multi-tenant / CORS, ya que NestJS intenta setear cookies en dominios cruzados que a menudo fallan. Al tener el BFF en Next.js gestionando esto, la lógica de cookies del backend es redundante, conflictiva y rompe respuestas (ver Issue 01).
- **Evidencia (logs o comportamiento):** Ambos sistemas tienen código para emitir la cabecera `Set-Cookie` para la misma información.
- **Impacto:** Medio. Confusión en el flujo, errores de CORS al setear cookies directamente desde el backend API a un dominio frontend, y acoplamiento innecesario del backend API a clientes web específicos.

# Pasos para reproducir:
1. Revisar `auth.controller.ts` en el backend: hay lógica que usa la dependencia `cookie-parser` y modifica `res` directamente.
2. Revisar `route.ts` en `/api/auth/login` (Next.js): hay lógica que usa la API de cookies de Next.js.

# Comportamiento esperado:
Un Backend API puro e independiente de la presentación que solo envíe cabeceras `Authorization` o cuerpos de respuesta JSON. El cliente BFF debe ser el único responsable de transformar estos tokens en mecanismos de estado web (Cookies).

# Comportamiento actual:
Responsabilidades divididas y duplicadas entre NestJS y el BFF (Next.js) respecto al manejo de Cookies.

# Solución propuesta:
Refactorizar el backend para eliminar el soporte y la lógica de cookies (`res.cookie` y dependencias directas en controladores como `cookie-parser`). Dejar que las cookies sean problema exclusivo del BFF en Next.js. El controlador de NestJS solo debe recibir encabezados estandar y cuerpos JSON, y devolver JSON puro.

# Checklist:
- [ ] Fix implementado
- [ ] Test agregado
- [ ] Validado manualmente

# Labels sugeridos:
- auth
- architecture
- backend

# Prioridad:
- Medium