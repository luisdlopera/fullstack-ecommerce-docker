# Port Allocation Strategy

## Standardized Port Range: 5000+

Nexstore uses a consistent port allocation strategy in the 5000+ range for all services.

## Port Assignments

| Service | Port | Purpose | Default Mapping |
|---------|------|---------|-----------------|
| **Frontend** | 5000 | Next.js dev server | 5000 → 5000 |
| **Backend API** | 5001 | NestJS application | 5001 → 5001 |
| **PostgreSQL** | 5002 | Database | 5002 → 5432 |
| **Redis** | 5003 | Cache/Queues | 5003 → 6379 |
| **MinIO API** | 5004 | S3-compatible storage | 5004 → 9000 |
| **MinIO Console** | 5005 | Web admin interface | 5005 → 9001 |

## Test Ports

| Service | Port | Purpose |
|---------|------|---------|
| **Test Frontend** | 5100 | E2E testing instance |
| **Test Backend** | 5101 | Test API instance |

## Configuration

### Environment Variables

```env
# Override defaults as needed
FRONT_PORT=5000
BACK_PORT=5001
POSTGRES_PORT=5002
REDIS_PORT=5003
MINIO_PORT=5004
MINIO_CONSOLE_PORT=5005
```

### Docker Compose Mapping

```yaml
services:
  postgres:
    ports:
      - '${POSTGRES_PORT:-5002}:5432'
  
  redis:
    ports:
      - '${REDIS_PORT:-5003}:6379'
  
  minio:
    ports:
      - '${MINIO_PORT:-5004}:9000'
      - '${MINIO_CONSOLE_PORT:-5005}:9001'
  
  back:
    ports:
      - '${BACK_PORT:-5001}:5001'
  
  front:
    ports:
      - '${FRONT_PORT:-5000}:5000'
```

## URL Reference

| Service | Development URL |
|---------|-----------------|
| Frontend | `http://localhost:5000` |
| Backend API | `http://localhost:5001/api` |
| Swagger Docs | `http://localhost:5001/api/docs` |
| Health Check | `http://localhost:5001/api/health` |
| PostgreSQL | `localhost:5002` |
| Redis | `localhost:5003` |
| MinIO API | `http://localhost:5004` |
| MinIO Console | `http://localhost:5005` |

## Port Conflicts

### Automatic Fallback

The development scripts automatically find the next available port if the default is in use:

```bash
# If 5000 is busy, Next.js will use 5001, 5002, etc.
npm run dev:apps
```

### Manual Override

```bash
# PowerShell
$env:FRONT_PORT=3010
$env:BACK_PORT=4010
npm run dev:apps

# Linux/Mac
FRONT_PORT=3010 BACK_PORT=4010 npm run dev:apps
```

### Check Port Usage

```bash
# macOS/Linux
lsof -i :5000

# Windows
netstat -ano | findstr :5000
```

## Service Dependencies

```
postgres (5002) ──┐
                  ├──▶ back (5001) ──▶ front (5000)
redis (5003) ─────┤         ▲
                  │         │
minio (5004) ─────┘         │ (after healthy)
                    minio-init
```

Startup order enforced via `depends_on` and health checks.

## Production Ports

In production deployments, standard ports are used:

| Service | Production Port |
|---------|-----------------|
| Frontend | 80 / 443 (HTTPS) |
| Backend | 3000 / 4000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO/R2 | 9000 / 443 |

## Playwright Test Configuration

```javascript
// playwright.config.mjs
export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
  },
});
```

## References

- [Docker Services](./docker-services.md)
- [Environment Variables](./environment-vars.md)
