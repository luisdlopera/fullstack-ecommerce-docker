# System Design

## High-Level Architecture

Nexstore follows a monorepo architecture with clear separation between frontend and backend concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Browser    │  │   Mobile     │  │    Admin     │        │
│  │  (Next.js)   │  │  (Responsive)│  │   Dashboard  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  App Router  │  Server Components  │  Client Logic   │ │
│  │  /app        │  /features          │  /contexts        │ │
│  └──────────────────────────────────────────────────────┘ │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────┐           │
│  │  BFF Pattern (Backend-for-Frontend)        │           │
│  │  /app/api/auth/*  /app/api/bff/*           │           │
│  └──────────────────────┬─────────────────────┘           │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTP / JSON
┌─────────────────────────▼──────────────────────────────────┐
│                    Backend (NestJS)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Hexagonal Architecture - Bounded Contexts             │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │  Auth   │ │  Users  │ │ Products│ │ Orders  │        │ │
│  │  │Module   │ │Module   │ │Module   │ │Module   │        │ │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │ │
│  │       └───────────┴───────────┴───────────┘              │ │
│  │                    Shared Layer                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │ │
│  │  │ Prisma  │  │  JWT    │  │ Storage │  │  Queues │     │ │
│  │  │ Service │  │  Auth   │  │  Port   │  │ BullMQ  │     │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬─────────────────────────────┘
                                 │
┌────────────────────────────────┼─────────────────────────────┐
│                    Infrastructure Layer                       │
│  ┌─────────┐  ┌─────────┐  ┌──┴──────┐  ┌─────────┐         │
│  │PostgreSQL│  │  Redis  │  │  MinIO  │  │Docker   │         │
│  │  Port   │  │  Port   │  │  (S3)   │  │Compose  │         │
│  │  5002   │  │  5003   │  │5004/5005│  │         │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└───────────────────────────────────────────────────────────────┘
```

## Service Communication

### Frontend → Backend
- **Protocol**: HTTP/REST
- **Base URL**: `NEXT_PUBLIC_API_URL` (browser) / `INTERNAL_API_URL` (server)
- **Auth**: JWT in httpOnly cookies
- **Prefix**: `/api/v1` for versioned endpoints

### Backend → Infrastructure
- **PostgreSQL**: Direct Prisma ORM connection
- **Redis**: BullMQ queue connection
- **MinIO**: AWS S3-compatible SDK

## Data Flow Patterns

### Public Catalog (Read-Heavy)
```
Browser → Next.js (SSR) → NestJS API → Prisma → PostgreSQL
                ↓
         CDN Cache (future)
```

### Authenticated Actions (Write-Heavy)
```
Browser → BFF Route → NestJS API → Prisma → PostgreSQL
                              ↓
                         BullMQ → Redis (async jobs)
```

### Image Upload
```
Admin UI → BFF → NestJS → StoragePort → MinIO (local) / R2 (prod)
                              ↓
                    Metadata → Prisma
```

## Port Allocation Strategy

All services use ports in the 5000+ range for consistency:

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5000 | Next.js dev server |
| Backend API | 5001 | NestJS application |
| PostgreSQL | 5002 | Database (mapped from 5432) |
| Redis | 5003 | Cache & queues (mapped from 6379) |
| MinIO API | 5004 | S3-compatible storage (mapped from 9000) |
| MinIO Console | 5005 | Web admin interface (mapped from 9001) |
| Test Frontend | 5100 | Playwright E2E testing |
| Test Backend | 5101 | Test API instance |

See [infrastructure/ports.md](../infrastructure/ports.md) for details.

## Scalability Considerations

### Horizontal Scaling Ready
- Stateless backend (JWT auth, no sessions)
- Externalized storage (MinIO/R2)
- Queue-based async processing
- Database connection pooling via Prisma

### Future Optimizations
- Redis for query caching
- CDN for static assets and images
- Read replicas for PostgreSQL
- Microservices split at module boundaries
