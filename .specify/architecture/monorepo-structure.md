# Monorepo Structure

## Workspace Organization

Nexstore uses npm workspaces to manage the monorepo with clear separation of concerns.

```
nexstore/
├── front/              # Next.js frontend application
├── back/               # NestJS backend API
├── packages/           # Shared packages
│   └── api-types/      # Common TypeScript types
├── docker-compose.yml  # Infrastructure orchestration
├── docker-compose.dev.yml  # Development overrides
├── package.json        # Root workspace configuration
└── .specify/           # Project documentation
```

## NPM Workspaces Configuration

```json
// root package.json
{
  "workspaces": ["back", "front", "packages/*"],
  "scripts": {
    "dev:stack": "npm run dev:db && npm run dev:apps",
    "dev:apps": "npm run dev:back & npm run dev:front",
    "dev:db": "docker-compose up -d postgres minio redis",
    "db:sync": "npm run prisma:generate -w back && npm run prisma:migrate:deploy -w back"
  }
}
```

## Frontend Workspace

**Path**: `front/`

**Stack**:
- Next.js 16 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 4
- HeroUI (component library)

**Key Scripts**:
```bash
npm run dev          # Start dev server (port 5000)
npm run build        # Production build
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint
npm run format       # Prettier
```

## Backend Workspace

**Path**: `back/`

**Stack**:
- NestJS 11
- Prisma 7
- PostgreSQL (via Docker)
- BullMQ (Redis queues)
- JWT Auth

**Key Scripts**:
```bash
npm run start:dev    # Start with tsx watch
npm run build        # TypeScript compilation
npm run test         # Jest unit tests
npm run prisma:migrate:dev  # Database migrations
npm run prisma:seed  # Seed test data
```

## Shared Packages

### @nexstore/api-types

**Path**: `packages/api-types/`

Shared TypeScript types between frontend and backend:
- Product types
- Order types
- User types
- API response types

**Usage**:
```typescript
// In frontend
import { Product, ProductListResponse } from '@nexstore/api-types';

// In backend (re-exported)
export * from '@nexstore/api-types';
```

## Cross-Workspace Development

### Running Services

**Full Stack (Database + Apps)**:
```bash
npm run dev:stack    # From root
```

**Apps Only (DB already running)**:
```bash
npm run dev:apps     # From root
```

**Individual Workspaces**:
```bash
npm run dev:front -w front   # Frontend only
npm run dev:back -w back     # Backend only
```

### Database Operations

**Schema Changes**:
```bash
# In back/ directory after modifying schema.prisma
npx prisma migrate dev
```

**Sync (after git pull)**:
```bash
npm run db:sync      # From root
```

**Seed Data**:
```bash
npm run prisma:seed -w back
```

## Dependency Management

### Installing Packages

**Root dependency** (shared across workspaces):
```bash
npm install <package> -w <workspace>
```

**Workspace-specific**:
```bash
npm install <package> -w back
npm install <package> -w front
```

### Version Constraints

Root `package.json` can enforce version overrides:
```json
{
  "overrides": {
    "path-to-regexp": "8.4.0",
    "handlebars": "4.7.9"
  }
}
```

## Build & Deployment

### Docker Build

```bash
docker-compose up --build
```

Builds both frontend and backend from respective Dockerfiles.

### Production Considerations

- Frontend builds as static + SSR with Next.js
- Backend compiles TypeScript to `dist/` directory
- Prisma client generates at build time
- Environment variables injected at runtime

## Development Workflow

### Daily Development

```bash
# 1. Start database (if not running)
npm run dev:db

# 2. Start apps
npm run dev:apps

# 3. Work on features
# - Frontend: http://localhost:5000
# - Backend: http://localhost:5001/api/health
# - Swagger: http://localhost:5001/api/docs
```

### After Schema Changes

```bash
# In back/ directory
npx prisma migrate dev --name <description>

# Or from root
npm run prisma:migrate:dev -w back
```

### Testing

```bash
# Backend unit tests
npm run test -w back

# Frontend E2E
npm run test:e2e -w front

# All tests
npm run test -w back && npm run test:e2e -w front
```
