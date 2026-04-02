# Port Allocation Strategy

## Official Port Convention (Strict)

Nexstore uses a **strict, non-negotiable** port allocation in the 5000+ range:

| Service | Port | Variable Name | Legacy Alias |
|---------|------|---------------|--------------|
| **Frontend** | 5006 | `FRONTEND_PORT` | `FRONT_PORT` |
| **Backend API** | 5007 | `BACKEND_PORT` | `BACK_PORT` |
| **PostgreSQL** | 5008 | `DATABASE_PORT` | `POSTGRES_PORT` |
| **Redis** | 5009 | `REDIS_PORT` | - |
| **MinIO API** | 5010 | `MINIO_PORT` | - |
| **MinIO Console** | 5011 | `MINIO_CONSOLE_PORT` | - |

**Critical Rules:**
1. **Never** use the same port for two services
2. **Never** let frontend and backend share ports (causes 404s on /api routes)
3. Frontend **must** call backend via `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
4. **Never** use relative `/api/*` URLs in frontend - always use full backend URL

## Architecture Decision

### Why strict separation?

```
┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │    Backend      │
│   (Next.js)     │◄────►│   (NestJS)      │
│   Port 5006     │      │   Port 5007     │
└─────────────────┘      └─────────────────┘
           │                        │
           │                        ▼
           │              ┌─────────────────┐
           │              │  /api/v1/*      │
           │              │  /api/health    │
           │              └─────────────────┘
           ▼
┌─────────────────┐
│  / (pages)      │
│  /products      │
└─────────────────┘
```

If frontend (5000) calls `/api/products`, Next.js intercepts it as a local API route → **404**.
Frontend must call `http://localhost:5001/api/v1/products` → Backend receives it → **200**.

## Configuration

### Environment Variables (Standard Names)

```env
# Primary names (use these)
FRONTEND_PORT=5006
BACKEND_PORT=5007
DATABASE_PORT=5008
REDIS_PORT=5009
MINIO_PORT=5010
MINIO_CONSOLE_PORT=5011

# Legacy aliases supported for backwards compatibility
FRONT_PORT=5006
BACK_PORT=5007
POSTGRES_PORT=5008
```

### Service Dependencies

```
postgres (5002) ──┐
                  ├──▶ back (5001) ──▶ front (5000)
redis (5003) ─────┤         ▲
                  │         │
minio (5004) ─────┘         │ (after healthy)
                    minio-init
```

## Docker Compose Mapping

```yaml
services:
  front:
    ports:
      - '${FRONTEND_PORT:-5006}:5006'
  back:
    ports:
      - '${BACKEND_PORT:-5007}:5007'
  postgres:
    ports:
      - '${DATABASE_PORT:-5008}:5432'
  redis:
    ports:
      - '${REDIS_PORT:-5009}:6379'
  minio:
    ports:
      - '${MINIO_PORT:-5010}:9000'
      - '${MINIO_CONSOLE_PORT:-5011}:9001'
```

## URL Reference

| Service | Development URL |
|---------|-----------------|
| Frontend | `http://localhost:5006` |
| Backend API | `http://localhost:5007/api` |
| Swagger Docs | `http://localhost:5007/api/docs` |
| Health Check | `http://localhost:5007/api/v1/health/simple` |
| PostgreSQL | `localhost:5008` |
| Redis | `localhost:5009` |
| MinIO API | `http://localhost:5010` |
| MinIO Console | `http://localhost:5011` |

## Port Conflicts

### Automatic Fallback (Dev Only)

If default ports are busy, `dev-apps.mjs` finds next available:
```bash
npm run dev:apps
# [dev:apps] Port fallback activated:
# - front: 5000 -> 5002
# - back: 5001 -> 5003
```

### Manual Override

```bash
# Linux/Mac
FRONTEND_PORT=3000 BACKEND_PORT=3001 npm run dev:apps

# Windows PowerShell
$env:FRONTEND_PORT=3000; $env:BACKEND_PORT=3001; npm run dev:apps
```

### Check Port Usage

```bash
# macOS/Linux
lsof -i :5006
lsof -i :5007

# Windows
netstat -ano | findstr :5006
```

## Frontend API Configuration

**Critical:** Frontend must use full backend URL, never relative paths.

```typescript
// front/src/lib/api.ts
const DEFAULT_API_URL = `http://localhost:${process.env.BACKEND_PORT || 5007}/api`;

// CORRECT: Full URL to backend
fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)

// WRONG: Relative path (Next.js intercepts)
fetch('/api/products')  // → 404 in browser
```

### Environment Files

```bash
# front/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5007/api
INTERNAL_API_URL=http://localhost:5007/api
```

## Production Ports

| Service | Production Port | Notes |
|---------|-----------------|-------|
| Frontend | 80 / 443 | Behind reverse proxy |
| Backend | 3000 / 4000 | Container internal |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |
| MinIO/R2 | 9000 / 443 | S3-compatible endpoint |

## Testing Ports

| Test Type | Frontend | Backend |
|-----------|----------|---------|
| E2E (playwright.config.mjs) | 5006 | 5007 |
| E2E Auth Real | 5006 | 5007 |
| Unit Tests | N/A | N/A |

## Validation

Run the validation script to check configuration:
```bash
npm run env:validate
```

Checks:
- ✅ Port variables defined
- ✅ No port conflicts in config
- ✅ URLs point to correct ports
- ✅ Docker compose mapping correct

## References

- [Environment Variables](./environment-vars.md)
- [Docker Services](./docker-services.md)
- [Architecture Decisions](../decisions/architecture-decisions.md)
