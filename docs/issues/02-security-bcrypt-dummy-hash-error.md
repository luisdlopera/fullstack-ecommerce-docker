# Título:
[AUTH] Login falla silenciosamente para usuarios inexistentes (Dummy Hash Bcrypt error)

# Descripción:
- **Contexto del problema:** En el caso de uso `login.use-case.ts` (backend), cuando un usuario no existe, la aplicación intenta realizar una comparación dummy con `bcryptjs.compare` usando un hash hardcodeado para prevenir ataques de *timing*.
- **Qué está fallando:** El hash dummy utilizado `$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha` es inválido (provoca un error de formato o versión de salt en bcryptjs). Esto causa que bcryptjs lance una excepción no controlada (`Error: Invalid salt version`), lo que devuelve un error 500 al cliente en lugar del esperado error 401 (Unauthorized), rompiendo el flujo limpio.
- **Evidencia (logs o comportamiento):** Al ingresar un email de un usuario que no existe en la base de datos, el servidor NestJS arroja un 500 Internal Server Error en la consola por la excepción de bcryptjs.
- **Impacto:** Alto. Expone errores internos del servidor, corrompe el flujo esperado del endpoint y permite *username enumeration* (enumeración de usuarios) debido a que los tiempos y el código HTTP de respuesta difieren entre usuarios existentes y no existentes.

# Pasos para reproducir:
1. Intentar iniciar sesión con un correo electrónico que no esté registrado en la base de datos (por ejemplo, `no-existe@example.com`).
2. Observar la respuesta HTTP del servidor. En lugar de un 401, el servidor devuelve un 500 con un log de error en la consola por parte de bcrypt.

# Comportamiento esperado:
El servidor debe retornar silenciosamente un error 401 Unauthorized sin arrojar excepciones internas de bcryptjs.

# Comportamiento actual:
El servidor arroja un 500 por un hash mal formado usado en la prevención de timing attacks.

# Solución propuesta:
Generar un hash estático válido con bcrypt (ej. `$2a$10$XUaE2o.8.vR.1W1oW8qF3ucH/qH6kXq5lA.pXQvP3x.o.lqZ6g3G6`) y utilizarlo como cadena dummy en `login.use-case.ts`.

# Checklist:
- [ ] Fix implementado
- [ ] Test agregado
- [ ] Validado manualmente

# Labels sugeridos:
- auth
- security
- backend

# Prioridad:
- High