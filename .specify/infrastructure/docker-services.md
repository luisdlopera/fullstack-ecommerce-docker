# Docker Services

## Overview

Nexstore uses Docker Compose for local development infrastructure: PostgreSQL, Redis, and MinIO.

## Services

### PostgreSQL

**Image**: `postgres:16`

**Purpose**: Primary database for application data

**Configuration**:
```yaml
services:
  postgres:
    image: postgres:16
    container_name: nexstore_db
    restart: unless-stopped
    ports:
      - '${POSTGRES_PORT:-5002}:5432'
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-nexstore}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nexstore}
      POSTGRES_DB: ${POSTGRES_DB:-nexstore}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-nexstore} -d ${POSTGRES_DB:-nexstore}']
      interval: 10s
      timeout: 5s
      retries: 5
```

**Access**:
- Host: `localhost:5002`
- User: `nexstore`
- Password: `nexstore`
- Database: `nexstore`

### Redis

**Image**: `redis:7-alpine`

**Purpose**: Cache and BullMQ queue backend

**Configuration**:
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: nexstore_redis
    restart: unless-stopped
    ports:
      - '${REDIS_PORT:-5003}:6379'
    volumes:
      - redis_data:/var/lib/redis/data
```

**Access**:
- Host: `localhost:5003`
- No authentication in development

**Usage**:
- BullMQ job queues
- Future: Session cache, query results cache

### MinIO

**Image**: `minio/minio:latest`

**Purpose**: S3-compatible object storage for product images

**Configuration**:
```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: nexstore_minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${STORAGE_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${STORAGE_SECRET_KEY:-minioadmin}
    command: server /data --console-address ':9001'
    ports:
      - '${MINIO_PORT:-5004}:9000'      # S3 API
      - '${MINIS3_CONSOLE_PORT:-5005}:9001'  # Web UI
    volumes:
      - minio_data:/data
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 10s
      timeout: 5s
      retries: 5
```

**Access**:
- S3 API: `http://localhost:5004`
- Console: `http://localhost:5005`
- Access Key: `minioadmin`
- Secret Key: `minioadmin`
- Default Bucket: `nexstore-products`

### MinIO Init

**Image**: `minio/mc:latest`

**Purpose**: Initialize MinIO bucket on startup

**Configuration**:
```yaml
services:
  minio-init:
    image: minio/mc:latest
    container_name: nexstore_minio_init
    depends_on:
      minio:
        condition: service_healthy
    restart: 'no'
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 ${STORAGE_ACCESS_KEY:-minioadmin} ${STORAGE_SECRET_KEY:-minioadmin};
      mc mb --ignore-existing local/${STORAGE_BUCKET:-nexstore-products};
      mc anonymous set public local/${STORAGE_BUCKET:-nexstore-products};
      "
```

Creates `nexstore-products` bucket and makes it public for development.

### Backend Application

**Build**: `back/Dockerfile`

**Purpose**: NestJS API server

**Configuration**:
```yaml
services:
  back:
    build:
      context: ./back
      dockerfile: Dockerfile
    container_name: nexstore_back
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
      redis:
        condition: service_started
    env_file:
      - .env
    environment:
      PORT: 5001
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
    ports:
      - '5001:5001'
    healthcheck:
      test: ['CMD-SHELL', 'wget --spider -q http://127.0.0.1:5001/api/health || exit 1']
      interval: 15s
      timeout: 5s
      retries: 10
```

### Frontend Application

**Build**: `front/Dockerfile`

**Purpose**: Next.js application

**Configuration**:
```yaml
services:
  front:
    build:
      context: ./front
      dockerfile: Dockerfile
    container_name: nexstore_front
    restart: unless-stopped
    depends_on:
      back:
        condition: service_healthy
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:5001/api}
      INTERNAL_API_URL: http://back:5001/api/v1
    ports:
      - '5000:5000'
```

## Volumes

```yaml
volumes:
  pg_data:      # PostgreSQL persistent storage
  minio_data:   # MinIO object storage
  redis_data:   # Redis persistent storage
```

## Network

All services communicate via default Docker Compose network:
- Services can reach each other by service name (e.g., `postgres`, `redis`, `minio`)
- Backend connects to: `postgres:5432`, `redis:6379`, `minio:9000`

## Commands

### Start Infrastructure Only
```bash
npm run dev:db
# or
docker-compose up -d postgres minio redis
```

### Start Full Stack
```bash
npm run dev:stack
# or
docker-compose up -d
```

### Stop All Services
```bash
npm run dev:down
# or
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f back
docker-compose logs -f postgres
```

### Reset Database
```bash
# Remove volume (WARNING: deletes all data)
docker-compose down -v

# Recreate
docker-compose up -d postgres

# Run migrations
npm run db:sync
```

## Health Checks

All services include health checks for startup ordering:

| Service | Health Check | Startup Delay |
|---------|--------------|---------------|
| postgres | `pg_isready` | ~5s |
| minio | HTTP /minio/health/live | ~3s |
| redis | (no check, assumes fast) | ~1s |
| back | HTTP /api/health | ~10s |

## Production Considerations

### Not for Production

Docker Compose is for **local development only**.

### Production Deployment

- Use Kubernetes, AWS ECS, or similar
- PostgreSQL: Managed service (RDS, Cloud SQL)
- Redis: Managed service (ElastiCache, Memorystore)
- Storage: Cloudflare R2, AWS S3, or GCS
- Secrets: Use proper secret management (AWS Secrets Manager, etc.)

### Production Dockerfile Optimizations

```dockerfile
# Multi-stage build for smaller image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
```

## References

- [Ports Configuration](./ports.md)
- [Environment Variables](./environment-vars.md)
- [MinIO Storage](./minio-storage.md)
