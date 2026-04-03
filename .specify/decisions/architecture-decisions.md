# Architecture Decisions

## ADR-001: Hexagonal Architecture

### Status: Accepted

### Context

The backend needed a clear architecture that would:
- Support long-term maintainability
- Enable testing without database dependencies
- Allow swapping infrastructure (database, storage, payment providers)
- Support team scaling with clear boundaries

### Decision

Adopt **Hexagonal Architecture (Ports & Adapters)** with:
- Domain layer: Business logic, entities, repository ports
- Application layer: Use cases, orchestration
- Infrastructure layer: Framework code, adapters

### Consequences

**Positive**:
- Clear separation of concerns
- Testability (mock ports, no database needed)
- Technology independence
- Team parallelization by module

**Negative**:
- Initial learning curve
- More files/directories
- Some boilerplate code

### Implementation

Each module has structure:
```
modules/{feature}/
├── domain/ports/
├── application/use-cases/
└── infrastructure/
```

---

## ADR-002: NestJS + Prisma

### Status: Accepted

### Context

Needed a robust backend framework with:
- TypeScript support
- Dependency injection
- Database abstraction
- Good ecosystem

### Decision

Use **NestJS** framework with **Prisma ORM**.

### Consequences

**Positive**:
- Mature framework with decorators
- Excellent DI container
- Prisma provides type-safe queries
- Auto-generated migrations

**Negative**:
- Learning curve for NestJS decorators
- Prisma lock-in (though less than other ORMs)

---

## ADR-003: BullMQ for Async Processing

### Status: Accepted

### Context

Inventory alerts and payment processing need:
- Reliable async execution
- Retry capability
- Job tracking
- No blocking of HTTP requests

### Decision

Use **BullMQ** with **Redis** for job queues.

### Consequences

**Positive**:
- Reliable job processing
- Built-in retries and backoff
- Job monitoring
- Horizontal scaling ready

**Negative**:
- Additional infrastructure (Redis)
- Eventual consistency considerations

### Alternatives Considered

- **Bull** (older version): Rejected in favor of BullMQ (better architecture)
- **BullMQ Pro**: Not needed (single instance)
- **Bull Board**: Optional UI for monitoring

---

## ADR-004: MinIO / R2 for Storage

### Status: Accepted

### Context

Product images need:
- S3-compatible API
- Local development capability
- Production scalability
- Cost efficiency

### Decision

**Development**: MinIO (local S3-compatible)
**Production**: Cloudflare R2

### Consequences

**Positive**:
- Same code works for both environments
- Zero-cost local development
- R2 has no egress fees
- Easy testing without cloud dependencies

**Negative**:
- Slight differences in configuration
- MinIO requires path-style URLs

### Alternatives Considered

- **AWS S3**: Rejected (egress fees, complexity)
- **Google Cloud Storage**: Rejected (similar to S3)
- **Local filesystem**: Rejected (doesn't scale, no CDN)

---

## ADR-005: JWT + httpOnly Cookies

### Status: Accepted

### Context

Authentication needs:
- Stateless (scalable)
- XSS protection
- SSR compatibility
- Mobile support

### Decision

Use **JWT** with **httpOnly cookies** (via BFF pattern).

### Consequences

**Positive**:
- XSS resistant (cookies not accessible to JS)
- Works with SSR/Server Components
- No token storage needed on client
- Automatic browser handling

**Negative**:
- CSRF consideration (mitigated by SameSite)
- Slightly more complex than localStorage

### Alternatives Considered

- **localStorage**: Rejected (XSS vulnerability)
- **Session cookies**: Rejected (requires server-side session store)
- **Auth headers**: Rejected (no XSS protection)

---

## ADR-006: Next.js App Router

### Status: Accepted

### Context

Frontend needed:
- Server-side rendering for SEO
- Good developer experience
- React ecosystem compatibility
- File-based routing

### Decision

Use **Next.js 16+** with **App Router**.

### Consequences

**Positive**:
- Server Components for data fetching
- Built-in caching
- File-based routing
- API routes (BFF pattern)
- Excellent performance

**Negative**:
- Learning curve for App Router concepts
- "use client" directive complexity
- Cache invalidation nuances

### Alternatives Considered

- **Pages Router**: Rejected (App Router is future)
- **Remix**: Considered, but Next.js has better ecosystem
- **Astro**: Rejected (less React ecosystem support)

---

## ADR-007: HeroUI Component Library

### Status: Accepted

### Context

Need consistent, accessible UI components without building from scratch.

### Decision

Use **HeroUI** (formerly NextUI) with **Tailwind CSS**.

### Consequences

**Positive**:
- Beautiful, accessible components
- Tailwind integration
- Customizable themes
- Good TypeScript support

**Negative**:
- Bundle size (mitigated by tree-shaking)
- Tailwind CSS 4 migration required

### Alternatives Considered

- **Material UI**: Rejected (heavy, opinionated styling)
- **Chakra UI**: Considered, HeroUI won on design
- **shadcn/ui**: Considered, HeroUI more complete

---

## ADR-008: MercadoPago for Colombia

### Status: Accepted

### Context

Colombia market needs local payment methods:
- Credit/debit cards
- PSE (bank transfer)
- Cash payments (Efecty/Baloto)

### Decision

Use **MercadoPago** for Colombian market.

### Consequences

**Positive**:
- Complete local payment coverage
- Good developer documentation
- Webhook support
- Local support

**Negative**:
- Colombia-only (need other providers for expansion)
- Transaction fees

### Alternatives Considered

- **Stripe**: Rejected (limited Colombia support at time of decision)
- **PayU**: Considered, MercadoPago better ecosystem
- **Wompi**: Rejected (newer, less mature)

---

## ADR-009: npm Workspaces

### Status: Accepted

### Context

Need to manage frontend, backend, and shared packages in single repository.

### Decision

Use **npm workspaces** for monorepo management.

### Consequences

**Positive**:
- Native npm support (no extra tools)
- Shared dependencies hoisted
- Simple workspace scripts
- Easy local development

**Negative**:
- No built-in task orchestration (use scripts)
- No advanced caching (like Turborepo)

### Alternatives Considered

- **Turborepo**: Rejected (overkill for 2-3 packages)
- **Nx**: Rejected (complexity)
- **pnpm workspaces**: Considered, npm sufficient

---

## ADR-010: PostgreSQL with Prisma

### Status: Accepted

### Context

Primary database needs:
- Relational data (products, orders, users)
- ACID compliance
- JSON support for flexibility
- Good TypeScript integration

### Decision

Use **PostgreSQL 16** with **Prisma ORM**.

### Consequences

**Positive**:
- ACID compliance
- Excellent Prisma integration
- JSON/JSONB support
- Full-text search capability
- Managed options available

**Negative**:
- Schema changes require migrations
- Not ideal for unstructured data (use R2 for images)

### Alternatives Considered

- **MySQL**: Rejected (Prisma better with PostgreSQL)
- **MongoDB**: Rejected (relational data fits better)
- **SQLite**: Rejected (not production-ready)

---

## Future Decisions

### Under Consideration

- **Redis for caching**: Query result caching, session cache
- **CDN for images**: Cloudflare CDN in front of R2
- **GraphQL**: Replacing REST for more flexible queries
- **Microservices**: Splitting at module boundaries

---

## References

- [Architecture Overview](../../architecture/hexagonal-backend.md)
- [Tech Stack Summary](../../architecture/system-design.md)
- [ADR Wikipedia](https://en.wikipedia.org/wiki/Architectural_decision)
