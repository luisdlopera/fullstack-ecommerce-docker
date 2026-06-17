# Auditoría de Autenticación - Issues Encontrados

A continuación se detallan los problemas encontrados durante la auditoría del flujo de autenticación, listos para ser transformados en issues de GitHub.

---

## 🔴 Críticos (rompen login)

### Título:
[AUTH] CORS y red de Docker causan errores de conexión Frontend-Backend (`ECONNREFUSED`)

### Descripción:
- **Contexto del problema:** En el Next.js Frontend, la ruta API `/api/auth/login` hace fetch al backend usando `http://localhost:5007/api/auth/login`. En entornos contenerizados o redes diferentes, `localhost` se resuelve a la propia red del frontend, en lugar del contenedor/proceso del backend, resultando en que la petición falle por `ECONNREFUSED`.
- **Qué está fallando:** `fetch` desde Next.js App Router (backend-side) no logra conectarse con el API backend en localhost. Adicionalmente, el middleware o interceptor podría tener inconsistencias respecto a CORS o puertos.
- **Evidencia:** Logs indican `Couldn't connect to server` (y el error `ECONNREFUSED` que ocurre cuando se lanza el proxy local).
- **Impacto:** El inicio de sesión es completamente imposible porque el Frontend no puede comunicarse con el Backend.

### Pasos para reproducir:
1. Desplegar frontend y backend usando Docker / distintos puertos locales.
2. Intentar loguearse a través del Frontend.
3. Observar los logs del backend (no llega la petición) y del frontend (`fetch failed / ECONNREFUSED`).

### Comportamiento esperado:
El Frontend BFF (`/api/auth/login`) se conecte correctamente a la red interna del Backend usando la URL de entorno correcta (ej: `http://backend:5007/api/auth/login`).

### Comportamiento actual:
Falla de conexión `ECONNREFUSED`.

### Solución propuesta:
Asegurarse de que `INTERNAL_API_URL` esté correctamente inyectado al Frontend apuntando al alias del Docker (`http://backend:5007/api`) o configurar la red local correctamente.

### Checklist:
- [ ] Fix implementado (Revisar docker-compose.yml / env vars del frontend)
- [ ] Test agregado
- [ ] Validado manualmente

### Labels sugeridos:
- auth
- bug
- backend / frontend
- devops

### Prioridad:
- Critical

---

## 🔴 Críticos (rompen login)

### Título:
[AUTH] JWT_SECRET es expuesto al frontend y mal configurado en entorno de desarrollo.

### Descripción:
- **Contexto del problema:** Las variables de entorno en el backend (`.env.example`) definen un string literal `JWT_SECRET=replace-with-a-long-random-secret`. Además, si esta variable falta, la generación de token de JWT y el AuthGuard lanzan una excepción.
- **Qué está fallando:** Si las variables no se cargan o se inyectan correctamente (por ejemplo, porque el root `.env` no es cargado por `dotenv`), el JWT token strategy va a fallar al crear tokens.
- **Evidencia:** En `jwt-token.service.ts` se lee repetidamente `process.env.JWT_SECRET` en varios métodos asíncronos y sincrónicos.
- **Impacto:** Falla total de emisión de sesión/validación (si es missing) o riesgo masivo de seguridad si es predecible en prod.

### Pasos para reproducir:
1. Iniciar backend sin definir `JWT_SECRET`.
2. Tratar de loguearse.
3. Se arroja error por secreto ausente (`¡Ups! Error de configuración del servidor.`).

### Comportamiento esperado:
El servicio use ConfigModule tipado con validación estricta al iniciar para evitar que corra sin `JWT_SECRET` o que se instancie con `replace-with-a-long-random-secret` en prod.

### Comportamiento actual:
Se carga a demanda con validaciones frágiles.

### Solución propuesta:
Mover la validación de `JWT_SECRET` a nivel de inyección/configuración global y tipar fuertemente las configuraciones de NestJS, rechazando inicio si no está.

### Checklist:
- [ ] Fix implementado
- [ ] Test agregado
- [ ] Validado manualmente

### Labels sugeridos:
- auth
- bug
- backend
- security

### Prioridad:
- Critical

---

## 🟠 Flujo (problemas de integración front-back)

### Título:
[AUTH] Duplicación de Cookies en Respuesta y Header

### Descripción:
- **Contexto del problema:** El backend está configurado para retornar tokens tanto en el cuerpo (`accessToken`, `refreshToken`) y, si `AUTH_COOKIES=true`, también setea cookies mediante `response.cookie()`. A su vez, el frontend (ruta `/api/auth/login`) intercepta la respuesta en JSON y sobreescribe o setea sus propias cookies usando `applyAuthCookies(response)`.
- **Qué está fallando:** Esto genera confusión en la responsabilidad (BFF vs API pura) y podría llevar a conflictos de domains/paths si backend y frontend difieren en cómo configuran SameSite/Secure.
- **Evidencia:** `auth.controller.ts` (línea 72) tiene `response.cookie('refreshToken', ...)` mientras que el Frontend `route.ts` hace `applyAuthCookies`.
- **Impacto:** Inconsistencia de sesión en entornos cloud.

### Pasos para reproducir:
1. Loguearse desde el Frontend.
2. Observar headers del Backend y luego headers de NextResponse.

### Comportamiento esperado:
Si se usa BFF (Next.js route handlers), el backend debería comportarse puramente como API devolviendo tokens JSON, y el BFF se encarga de transformarlos a cookies `httpOnly`. O viceversa, pero no ambos seteando cookies cruzadas en distintos dominios sin coordinación.

### Comportamiento actual:
Ambos intentan setear estado de cookie.

### Solución propuesta:
Deshabilitar explícitamente `AUTH_COOKIES` en el backend cuando se usa el BFF, limitando el backend a devolver payload JSON y dejando el manejo de cookies exclusivamente al proxy Next.js.

### Checklist:
- [ ] Fix implementado
- [ ] Test agregado
- [ ] Validado manualmente

### Labels sugeridos:
- auth
- architecture
- backend / frontend

### Prioridad:
- High

---

## 🟡 Arquitectura

### Título:
[AUTH] Fuerte acoplamiento a `process.env` en lógica de negocio (Use Cases / Services)

### Descripción:
- **Contexto del problema:** Servicios y Use Cases (ej: `jwt-token.service.ts`, `login.use-case.ts`) leen repetidamente `process.env.JWT_REFRESH_TTL` y configuran lógicas parseando sus valores localmente en métodos repetidos (como `parseTtlToMs`).
- **Qué está fallando:** La arquitectura hexagonal busca desacoplar infraestructura de dominio. Leer `process.env` dentro del caso de uso ensucia la lógica de negocio y dificulta las pruebas unitarias.
- **Evidencia:** `login.use-case.ts` línea 173 `const expiresAt = new Date(Date.now() + this.parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '7d'));`.
- **Impacto:** Menor mantenibilidad, tests más complejos de mockear y posible fuga de responsabilidades.

### Solución propuesta:
Inyectar un `ConfigService` de NestJS o pasar el TTL por dependencias, manteniendo los Use Cases ignorantes de variables de entorno globales.

### Labels sugeridos:
- auth
- improvement
- backend

### Prioridad:
- Medium

---

## 🔵 Observabilidad/logging

### Título:
[AUTH] Errores silenciosos o carentes de Stack Trace en flujos críticos.

### Descripción:
- **Contexto del problema:** Hasta mi última actualización, el frontend y backend logueaban "Unknown error" u ocultaban el stack real de las excepciones lanzadas (e.g. `e.message` pero omitiendo el origen real del fallo).
- **Qué está fallando:** Cuando falla la conexión o hay errores en el runtime de DB, los logs quedan inservibles sin un stack trace.
- **Impacto:** Dificultad para debuggear problemas en producción o entornos locales como el de ahora (falla de backend que impacta al frontend sin suficiente info).
- **Solución propuesta:** Ya hemos implementado parte del fix, pero sugerimos expandir el Logger de NestJS y usar el Winston logger (si disponible) en lugar de un flag env-based booleano y logs de consola pura.

### Labels sugeridos:
- auth
- observability
- backend / frontend

### Prioridad:
- Medium

---

## 🟢 Seguridad

### Título:
🛡️ Sentinel: High - Bcrypt dummy hash timing attack bypass

### Descripción:
- **Contexto del problema:** En `LoginUseCase`, cuando un usuario no existe, se ejecuta una comparación dummy con `$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha`.
- **Qué está fallando:** El formato de este hash es inválido (no es un string base64 válido en bcrypt). Esto causa que `bcryptjs.compare` aborte casi de inmediato sin hacer la computación de hashes de costo 12.
- **Evidencia:** `login.use-case.ts` línea 52: `await bcryptjs.compare(input.password, '$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha');`.
- **Impacto:** Un atacante puede enumerar qué usuarios existen basándose en la latencia de la petición (`timing attack`).

### Solución propuesta:
Generar un hash real bcrypt con costo 12 al iniciar la aplicación (o guardado como constante generada validamente) y usar ese en su lugar.

### Labels sugeridos:
- auth
- security
- backend

### Prioridad:
- High
