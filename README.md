# NexStore

Si te gusta este proyecto, ¡deja una estrella en GitHub! ⭐ Ayuda a que más gente lo descubra.

---

NexStore es un e-commerce organizado como monorepo con separación clara entre frontend y backend:

- `front/`: Next.js (UI)
- `back/`: NestJS con arquitectura hexagonal + Prisma
- `docker-compose.yml`: servicios Docker para desarrollo local (`postgres` + `minio`)

## Stack

- Next.js (`latest`) + React (`latest`) en `front/`
- NestJS (`latest`) en `back/`
- Prisma + PostgreSQL
- npm workspaces para correr `front` y `back` en local
- Docker Compose para base de datos PostgreSQL

## Estructura

```txt
nexstore/
  front/                  # Next.js app
  back/                   # NestJS API + Prisma
  docker-compose.yml      # servicios Docker (en local: postgres, redis, minio)
  docker-compose.dev.yml  # desarrollo con hot reload
  .env.example            # plantilla de variables de entorno
```

> **Seguridad**: El archivo `.env.example` contiene placeholders seguros. Nunca uses secretos reales en archivos versionables. Copia a `.env` y reemplaza los valores.

## Puertos Estándar (Estrictos)

Este monorepo usa puertos **fijos y estrictos** - sin fallback automático:

| Servicio | Puerto | Variable |
|----------|--------|----------|
| **Frontend** | 5006 | `FRONTEND_PORT` |
| **Backend** | 5007 | `BACKEND_PORT` |
| **PostgreSQL** | 5008 | `DATABASE_PORT` |
| **Redis** | 5009 | `REDIS_PORT` |
| **MinIO** | 5010 | `MINIO_PORT` |

**Reglas críticas:**
- Si un puerto está ocupado, el proceso **falla** (no cambia de puerto)
- Usa `npm run dev:clean` antes de arrancar si hay conflictos
- Frontend siempre en 5006, Backend siempre en 5007

**Comandos de limpieza:**
```bash
npm run dev:clean        # Mata procesos en 5006 y 5007
npm run dev              # Limpia y arranca apps
npm run dev:stack        # Limpia, arranca DB y apps
```

## Paso a paso en otro PC (o instalación desde cero)

1) Clona el repositorio:

```bash
git clone <URL_DEL_REPO>
cd nexstore
```

2) Crea el archivo de entorno:

```bash
copy .env.example .env       # Windows
cp .env.example .env         # Linux/Mac
```

3) Edita `.env` y cambia `JWT_SECRET` por un valor seguro:

```bash
# Genera un secreto aleatorio (Linux/Mac):
openssl rand -hex 64
```

4) Levanta PostgreSQL + MinIO:

```bash
npm run dev:db
```

5) Aplica migraciones, genera cliente Prisma y carga seed:

```bash
npm run db:sync:seed
```

6) Levanta frontend + backend locales:

```bash
npm run dev:apps
```

7) Abre:

- Frontend: `http://localhost:5006`
- Backend API: `http://localhost:5007/api/health`
- Swagger docs: `http://localhost:5007/api/docs`

8) Cargar datos de prueba (usuarios, productos, países, etc.) cuando lo necesites:

**Con el backend en local** (desde la raíz del repo, con PostgreSQL accesible y `DATABASE_URL` en `.env`):

```bash
npm run prisma:seed -w back
```

**Con Docker** (contenedor del API en ejecución):

```bash
docker exec -it nexstore_back npx prisma db seed
```

El seed define cuentas como `admin@nexstore.com` / `Qwert.12345` (ver sección *Usuarios de prueba*).

## Flujo de desarrollo recomendado

Desde la raíz del proyecto:

1) Primera ejecución del día (si la DB no está arriba):

```bash
npm run dev:stack
```

2) Día a día (DB ya arriba, solo apps locales):

```bash
npm run dev:apps
```

Si `5000` o `5001` están ocupados, `dev:apps` elige automáticamente el siguiente puerto libre.

3) Si hubo cambios de schema ya migrados en git (pull/CI):

```bash
npm run db:sync
```

4) Si tú cambiaste `schema.prisma` en local:

```bash
npm run prisma:migrate:dev -w back
```

5) Levantar PostgreSQL + MinIO:

```bash
npm run dev:db
```

6) Apagar contenedores Docker:

```bash
npm run dev:down
```

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev:stack` | Levanta DB (`postgres`) y ejecuta `back` + `front` en paralelo |
| `npm run dev:apps` | Ejecuta `back` + `front` en paralelo usando npm workspaces |
| `npm run dev:db` | Levanta PostgreSQL + MinIO con Docker Compose |
| `npm run dev:down` | Apaga contenedores Docker del proyecto |
| `npm run db:sync` | Ejecuta `prisma generate` + `prisma migrate deploy` en `back/` |
| `npm run db:sync:seed` | Ejecuta `db:sync` y luego el seed del backend |
| `npm run dev:front` | Ejecuta solo frontend |
| `npm run dev:back` | Ejecuta solo backend |
| `npm run format` | Formatea `front/` y `back/` con Prettier |

## Desarrollo con hot reload

- `front` corre con `next dev` y recarga en caliente.
- `back` corre con `tsx watch` y recompila automáticamente.
- Frontend y backend corren localmente vía npm workspaces.
- Si PowerShell bloquea `npm`, usa `npm.cmd run dev:stack`.

### Puertos en desarrollo

- Puertos por defecto: `front=5000`, `back=5001`.
- Si están ocupados, `npm run dev:apps` hace fallback automático al siguiente puerto libre.
- Puedes forzar puertos base con variables de entorno:

```bash
# PowerShell
$env:FRONT_PORT=3010
$env:BACK_PORT=4010
npm run dev:apps
```

## URLs de referencia

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5000` |
| Backend API | `http://localhost:5001/api` |
| Swagger Docs | `http://localhost:5001/api/docs` |
| Health check | `http://localhost:5001/api/health` |
| PostgreSQL | `localhost:5002` |
| MinIO API (S3) | `http://localhost:5004` |
| MinIO Console | `http://localhost:5005` |

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@nexstore.com | Qwert.12345 |
| Cliente | cliente@nexstore.com | Qwert.12345 |

## Desarrollo local

Instala dependencias en raíz (workspaces):

```bash
npm install
```

Luego ejecuta uno de estos flujos:

```bash
npm run dev:stack   # DB + apps
npm run dev:apps    # solo apps (DB ya levantada)
```

## Prisma (backend)

Comandos recomendados desde la raíz:

```bash
npm run db:sync                      # generate + migrate deploy
npm run db:sync:seed                 # db:sync + seed
npm run prisma:migrate:dev -w back   # cuando tú cambias schema.prisma
```

El seed también se puede ejecutar con `npx prisma db seed` dentro de `back/` (usa `prisma.seed` del `package.json` del backend).

## Storage de imágenes (backend)

- Arquitectura y uso: `back/docs/STORAGE.md`
- Puerto: `StoragePort` (desacoplado del proveedor)
- Local: MinIO
- Demo/Prod: Cloudflare R2

## Formato de código

Desde la raíz del monorepo:

```bash
npm run format
```

Equivale a formatear el frontend (`prettier --write .` en `front/`) y el backend (`src` y `prisma` en `back/`). Comprobar sin escribir: `npm run format:check -w back` y `npm run prettier:check -w front`.

## Problemas frecuentes

### Error: "Cannot start server - port already in use" o ECONNREFUSED

**Síntoma:** Frontend o backend no arrancan, o hay conflictos de puerto.

**Causa:** Dos servicios intentan usar el mismo puerto (ej: frontend y backend ambos en 5001).

**Solución:**
```bash
# 1. Mata procesos huérfanos
pkill -f "next dev"
pkill -f "tsx watch"

# 2. Reinicia con puertos explícitos
FRONTEND_PORT=5000 BACKEND_PORT=5001 npm run dev:apps
```

### Error: Frontend 404 en /api/* (Next.js intenta resolver rutas locales)

**Síntoma:** El frontend muestra 404 al llamar `/api/products/featured` o similares.

**Causa:** Next.js intercepta rutas `/api/*` y las trata como API routes locales en lugar de enviarlas al backend.

**Solución:**
- Verifica que `NEXT_PUBLIC_API_URL` apunte al backend (port 5001), no al frontend:
  ```bash
  # front/.env.local
  NEXT_PUBLIC_API_URL=http://localhost:5001/api
  ```
- Nunca uses rutas relativas `/api/...` en fetch del frontend - usa la URL completa del backend.

### Error: "Backend no responde" o timeouts

**Verificación paso a paso:**
```bash
# 1. Verifica infraestructura
docker ps  # Debe mostrar postgres, redis, minio

# 2. Verifica puertos
lsof -i :5000  # Frontend
lsof -i :5001  # Backend

# 3. Test health endpoints
curl http://localhost:5001/api/v1/health/simple

# 4. Verifica variables de entorno
cat front/.env.local | grep API_URL
cat back/.env | grep PORT
```

### Error: CORS bloqueando requests

**Síntoma:** El navegador bloquea requests al backend.

**Solución:**
- Verifica `CORS_ORIGIN` en backend apunte al frontend correcto:
  ```bash
  # back/.env
  CORS_ORIGIN=http://localhost:5000
  ```

### Error: Prisma/Database connection failed

**Síntoma:** Backend logs muestran errores de conexión a PostgreSQL.

**Verificación:**
```bash
# Test directo a la base
docker exec nexstore_db psql -U nexstore -d nexstore -c "SELECT 1;"

# Verifica DATABASE_URL
# Debe ser: postgresql://nexstore:nexstore@localhost:5002/nexstore?schema=public
```

### Otros errores comunes

- **Login responde 500:** Comprueba que el API tenga `JWT_SECRET` (en Docker, el `docker-compose.yml` carga `.env` y define JWT). Reinicia el contenedor o el proceso de Nest tras cambios en auth.
- **Seed sin datos / sin usuarios:** Ejecuta `npm run prisma:seed -w back` o el `docker exec` indicado arriba con la base ya levantada.
- **Redis connection error:** Verifica que el contenedor redis esté corriendo: `docker ps | grep redis`

## Tests (backend)

```bash
npm run test -w back          # ejecutar tests
npm run test:watch -w back    # modo watch
npm run test:cov -w back      # con cobertura
```

## Gobernanza del repositorio

- Licencia: ver `LICENSE`.
- Seguridad: política y reporte en `SECURITY.md`.
- Contribución: flujo de ramas, commits y PR checklist en `CONTRIBUTING.md`.

## Calidad y CI

- CI principal en `.github/workflows/ci.yml`.
- Escaneo de secretos en `.github/workflows/secret-scan.yml`.
- Auditoría de dependencias en `.github/workflows/security-audit.yml`.
- Actualizaciones automáticas de dependencias en `.github/dependabot.yml`.

## Architecture

This project follows Spec-Driven Development using GitHub Spec Kit.

See:
- .specify/spec.md
- .specify/plan.md
- .specify/tasks/
