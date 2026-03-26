# NexStore

Si te gusta este proyecto, ¡deja una estrella en GitHub! ⭐ Ayuda a que más gente lo descubra.

---

NexStore es un e-commerce organizado como monorepo con separación clara entre frontend y backend:

- `front/`: Next.js (UI)
- `back/`: NestJS con arquitectura hexagonal + Prisma
- `docker-compose.yml`: orquestación completa (`front`, `back`, `postgres`)

## Stack

- Next.js (`latest`) + React (`latest`) en `front/`
- NestJS (`latest`) en `back/`
- Prisma + PostgreSQL
- Docker Compose para levantar todo con un comando

## Estructura

```txt
nexstore/
  front/                  # Next.js app
  back/                   # NestJS API + Prisma
  docker-compose.yml      # postgres + back + front
  docker-compose.dev.yml  # overrides para desarrollo con hot reload
  .env.template
```

## Paso a paso en otro PC (o instalación desde cero)

1) Clona el repositorio:

```bash
git clone <URL_DEL_REPO>
cd nexstore
```

2) Crea el archivo de entorno:

```bash
copy .env.template .env       # Windows
cp .env.template .env         # Linux/Mac
```

3) Edita `.env` y cambia `JWT_SECRET` por un valor seguro:

```bash
# Genera un secreto aleatorio (Linux/Mac):
openssl rand -hex 64
```

4) Levanta el proyecto en modo desarrollo (Docker + hot reload):

```bash
npm run dev:build
```

5) Abre:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api/health`
- Swagger docs: `http://localhost:4000/api/docs`

6) Cargar datos de prueba (usuarios, productos, países, etc.):

**Con el backend en local** (desde la raíz del repo, con PostgreSQL accesible y `DATABASE_URL` en `.env`):

```bash
npm run prisma:seed -w back
```

**Con Docker** (contenedor del API en ejecución):

```bash
docker exec -it nexstore_back npx prisma db seed
```

El seed define cuentas como `admin@nexstore.com` / `Qwert.12345` (ver sección *Usuarios de prueba*).

## Si apagas el PC o quieres volver a ejecutar

Desde la raíz del proyecto:

1) Levantar nuevamente (sin reconstruir):

```bash
npm run dev:up
```

2) Si cambiaste dependencias o Dockerfile (reconstruir):

```bash
npm run dev:build
```

3) Si hay problemas con volúmenes o dependencias (limpieza total + rebuild):

```bash
npm run dev:clean
```

4) Para detener todo:

```bash
npm run dev:down
```

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev:build` | Reconstruye imágenes y levanta en modo desarrollo |
| `npm run dev:up` | Levanta sin reconstruir (rápido) |
| `npm run dev:down` | Detiene todos los contenedores |
| `npm run dev:clean` | Borra volúmenes, reconstruye e inicia (soluciona problemas de deps) |
| `npm run format` | Formatea `front/` y `back/` con Prettier |

## Desarrollo con hot reload

- `front` corre con `next dev --webpack` y recarga en caliente.
- `back` corre con `tsx watch` y recompila automáticamente.
- En Docker dev, `front` usa `webpack` (sin Turbopack) para evitar errores intermitentes.
- Si PowerShell bloquea `npm`, usa `npm.cmd run dev:build`.

## URLs de referencia

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:4000/api` |
| Swagger Docs | `http://localhost:4000/api/docs` |
| Health check | `http://localhost:4000/api/health` |
| PostgreSQL | `localhost:5432` |

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@nexstore.com | Qwert.12345 |
| Cliente | cliente@nexstore.com | Qwert.12345 |

## Desarrollo local sin Docker

Instala dependencias en raíz (workspaces):

```bash
npm install
```

Luego ejecuta:

```bash
npm run dev:front
npm run dev:back
```

## Prisma (backend)

Comandos útiles:

```bash
npm run prisma:generate -w back
npm run prisma:migrate:dev -w back
npm run prisma:seed -w back
```

El seed también se puede ejecutar con `npx prisma db seed` dentro de `back/` (usa `prisma.seed` del `package.json` del backend).

## Formato de código

Desde la raíz del monorepo:

```bash
npm run format
```

Equivale a formatear el frontend (`prettier --write .` en `front/`) y el backend (`src` y `prisma` en `back/`). Comprobar sin escribir: `npm run format:check -w back` y `npm run prettier:check -w front`.

## Problemas frecuentes

- **Login responde 500:** Comprueba que el API tenga `JWT_SECRET` (en Docker, el `docker-compose.yml` carga `.env` y define JWT). Reinicia el contenedor o el proceso de Nest tras cambios en auth.
- **Seed sin datos / sin usuarios:** Ejecuta `npm run prisma:seed -w back` o el `docker exec` indicado arriba con la base ya levantada.

## Tests (backend)

```bash
npm run test -w back          # ejecutar tests
npm run test:watch -w back    # modo watch
npm run test:cov -w back      # con cobertura
```
