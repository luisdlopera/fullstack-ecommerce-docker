# NexStore

NexStore ahora está organizado como monorepo con separación clara entre frontend y backend:

- `front/`: Next.js (UI)
- `back/`: NestJS con arquitectura hexagonal + Prisma
- `docker-compose.yml`: orquestación completa (`front`, `back`, `postgres`)

## Stack actual

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
  .env.template
```

## Levantar todo con un comando

1) Crea `.env` en raíz a partir de `.env.template`:

```bash
cp .env.template .env
```

2) Levanta todo:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`
- Backend products: `http://localhost:4000/api/products/featured`
- PostgreSQL: `localhost:5432`

## Desarrollo con Docker (hot reload)

Para ver cambios del código inmediatamente sin reconstruir imágenes en cada cambio:

```bash
npm run dev:build
```

Luego, en ejecuciones siguientes puedes usar:

```bash
npm run dev:up
```

Para apagar contenedores:

```bash
npm run dev:down
```

Notas:

- `front` corre con `next dev` y recarga en caliente.
- `back` corre con `tsx watch` y recompila automáticamente.
- En Docker dev, `front` usa `webpack` (sin Turbopack) para evitar errores intermitentes de `Next.js package not found`.
- Si cambias dependencias (`package.json`), ejecuta de nuevo con `--build`.
- Si PowerShell bloquea `npm`, usa `npm.cmd run dev:build` (igual para `dev:up` y `dev:down`).

## Paso a paso en otro PC (o instalación desde cero)

1) Clona el repositorio:

```bash
git clone <URL_DEL_REPO>
cd nexstore
```

2) Crea el archivo de entorno:

```bash
copy .env.template .env
```

3) Levanta el proyecto en modo desarrollo (Docker + hot reload):

```bash
npm run dev:build
```

4) Abre:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`

## Si apagas el PC o quieres volver a ejecutar luego

Desde la raíz del proyecto:

1) Levantar nuevamente:

```bash
npm run dev:up
```

2) Si cambiaste dependencias o Dockerfile:

```bash
npm run dev:build
```

3) Para detener todo:

```bash
npm run dev:down
```

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
