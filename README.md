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
