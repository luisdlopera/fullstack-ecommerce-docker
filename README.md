# SellFlow System

<p align="center">
  <img src="https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev/home/slider/slider-1.webp" alt="SellFlow Banner" width="100%">
</p>

**System for managing orders, customers, and inventory for businesses that sell via WhatsApp**

> From chaos to control: manage your WhatsApp sales like a professional operation without changing how your customers buy.

---

## Problem

Every day, millions of small businesses in Latin America receive orders through WhatsApp. But behind the apparent simplicity lies operational chaos:

- **Lost orders** — Customer messages buried in chat history, forgotten requests, missed sales
- **No inventory control** — Selling products you don't have, missing restock opportunities, manual counts
- **No order tracking** — Customers constantly asking "where is my order?" without a clear answer
- **Scattered information** — Data spread across notebooks, spreadsheets, and chat apps
- **No customer history** — Every order feels like the first time, missing upsell opportunities

These businesses lose **money, customers, and growth opportunities** simply because they lack a system designed for their reality.

---

## Solution

**SellFlow** is an order management system built specifically for the WhatsApp commerce reality:

- **Capture orders** directly from WhatsApp conversations
- **Track inventory** in real-time with automatic alerts
- **Know your customers** with complete purchase history
- **Professional workflow** from order to delivery
- **No customer app needed** — They keep using WhatsApp normally

---

## Target Users

| Business Type | Use Case |
|--------------|----------|
| **Beauty Stores** | Skincare, cosmetics, nail salons selling to 200+ regular customers |
| **Hardware Stores** | Materials, tools, bulk orders from contractors |
| **Food Businesses** | Home kitchens, bakeries, meal prep with perishable inventory |
| **Distributors** | Multi-customer management, order aggregation, delivery routes |
| **Local Retailers** | Neighborhood shops using WhatsApp as main sales channel |

---

## Features

### Orders
- **Order lifecycle**: Draft → Confirmed → Processing → Shipped → Delivered
- **WhatsApp-optimized**: Capture orders from chat conversations
- **Status tracking**: Full visibility for operators and customers
- **Order notes**: Internal comments and customer communication history

### Inventory
- **Real-time stock**: Accurate inventory across all products
- **Multi-location**: Manage stock across multiple warehouses or stores
- **Low stock alerts**: Automatic notifications when inventory runs low
- **Complete audit**: Every inventory change tracked with user attribution

### Customers
- **Customer profiles**: Contact info, WhatsApp number, preferences
- **Purchase history**: Complete view of all transactions
- **Quick reorder**: Easy reordering based on past purchases
- **Customer tags**: Segment customers by type or value

### WhatsApp Flow
- **Mobile-first**: Full functionality on mobile devices
- **One-click WhatsApp**: Direct link to customer chat
- **Shareable catalog**: Quick product list for sharing
- **No customer friction**: Customers continue using WhatsApp normally

### Admin Panel
- **Dashboard overview**: Orders, revenue, inventory status at a glance
- **Role-based access**: Admin, manager, and operator permissions
- **Sales reports**: Trends, top products, customer insights
- **User management**: Add team members with specific permissions

---

## Differentiation

### This is NOT a Generic E-Commerce

| Generic E-Commerce | **SellFlow** |
|-------------------|----------------|
| Customers browse a website | Orders come from **WhatsApp conversations** |
| Automated checkout | **Manual confirmation** workflow with customers |
| Payment gateways | Track **cash and bank transfers** |
| Shipping integrations | **Local delivery** management |
| Anonymous buyers | **Known customers** with purchase history |

### Built for WhatsApp Commerce

- **Conversational orders** — System designed around chat-based sales
- **Human-in-the-loop** — Orders confirmed by business owner, not automated
- **Flexible payments** — Supports cash, bank transfers, mobile payments
- **Local delivery** — Optimized for in-house or local courier delivery
- **Relationship-focused** — Built to strengthen customer relationships

---

## Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 + React 19 + TypeScript |
| **Backend** | NestJS + TypeScript + Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Queue/Cache** | Redis 7 + BullMQ |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Auth** | JWT + RBAC |
| **DevOps** | Docker + Docker Compose |

---

## Run Locally

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- Docker + Docker Compose
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone <URL_DEL_REPO>
cd sellflow

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# 4. Start full stack (Database + Backend + Frontend)
npm run dev:stack
```

The system will be available at:
- **Frontend**: http://localhost:5006
- **Backend API**: http://localhost:5007/api
- **API Documentation**: http://localhost:5007/api/docs

### Environment Configuration

Edit `.env` file:

```bash
# Database
DATABASE_URL=postgresql://sellflow:sellflow@localhost:5008/sellflow?schema=public
POSTGRES_USER=sellflow
POSTGRES_PASSWORD=sellflow
POSTGRES_DB=sellflow
DATABASE_PORT=5008

# JWT Secret (generate a secure one)
JWT_SECRET=your-generated-secret-here

# Storage (Cloudflare R2)
STORAGE_PROVIDER=r2
STORAGE_BUCKET=sellflow-products
STORAGE_ENDPOINT=https://your-account.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_PUBLIC_URL=https://your-public-url.com

# Redis
REDIS_URL=redis://localhost:5009
```

Generate a secure JWT secret:
```bash
# macOS/Linux
openssl rand -hex 64
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:stack` | Start everything (DB + Backend + Frontend) |
| `npm run dev:apps` | Start only apps (DB must be running) |
| `npm run dev:db` | Start only database (PostgreSQL + Redis) |
| `npm run dev:down` | Stop all Docker containers |
| `npm run dev:front` | Start only frontend |
| `npm run dev:back` | Start only backend |
| `npm run db:sync` | Sync database schema (generate + migrate) |
| `npm run db:sync:seed` | Sync database and load seed data |
| `npm run db:seed` | Load seed data only |
| `npm run format` | Format all code with Prettier |
| `npm run build` | Build for production |

### Development Workflow

**First time setup:**
```bash
npm install
npm run dev:stack
```

**Daily development (DB already running):**
```bash
npm run dev:apps
```

**After pulling changes with schema updates:**
```bash
npm run db:sync
```

**Reset everything:**
```bash
npm run dev:down
npm run dev:stack
```

### Default Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5006 | Next.js development server |
| Backend | 5007 | NestJS API server |
| PostgreSQL | 5008 | Database |
| Redis | 5009 | Cache and queues |

### Test Users

After running seed, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sellflow.local | Qwert.12345 |
| Manager | manager@sellflow.local | Qwert.12345 |
| Operator | operator@sellflow.local | Qwert.12345 |

---

## Roadmap

### Phase 1 — Core (Current)
- Order management with WhatsApp workflow
- Inventory control with multi-location
- Customer management with history
- Admin panel with role-based access
- Product catalog with image upload

### Phase 2 — WhatsApp Integration
- WhatsApp Business API integration
- Automated customer notifications
- Click-to-order catalog links
- Order status updates via WhatsApp

### Phase 3 — SaaS Platform
- Multi-tenant architecture
- Self-service onboarding
- Subscription billing
- White-label customization

### Phase 4 — Ecosystem
- Delivery partner integrations
- Supplier management
- Financial tracking and reporting
- Mobile app for operators

---

## Business Vision

### Target Market
- **Primary**: Small businesses in Latin America selling via WhatsApp
- **Secondary**: Distributors and retailers using conversational commerce
- **TAM**: Millions of businesses using WhatsApp as primary sales channel

### Monetization Strategy

**Phase 1**: Custom implementation for individual businesses (service revenue)
**Phase 2**: SaaS subscription model:
- **Starter**: $29/month — 1 user, 100 orders/month
- **Professional**: $79/month — 5 users, unlimited orders
- **Enterprise**: $199/month — Unlimited users, API access, priority support

### Competitive Advantages
1. **Purpose-built** for WhatsApp commerce (not retrofitted e-commerce)
2. **Simplicity** over feature bloat
3. **Mobile-native** experience
4. **Fast implementation** (days, not months)

---

## Contact

**Luis David Lopera**

- **Email**: info@luisdavidlopera.com
- **WhatsApp**: +57 301 289 1218
- **Location**: Colombia

---

## SellFlow

> **"Turn your WhatsApp chaos into a professional sales operation."**

If this project helps your business, please consider giving it a star

---

## License

See [LICENSE](LICENSE) for details.

## Security

See [SECURITY.md](SECURITY.md) for security policies and reporting.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

**Síntoma:** El frontend muestra 404 al llamar `/api/products/featured` o similares.

**Causa:** Next.js intercepta rutas `/api/*` y las trata como API routes locales en lugar de enviarlas al backend.

**Solución:**
- Verifica `NEXT_PUBLIC_API_URL` apunte al backend (port 5001), no al frontend:
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

### Error: Prisma P3009 - Failed Migrations

**Síntoma:** Error durante `npm run dev:stack`
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `0001_init` migration failed
```

**Solución (Desarrollo Local):**
```bash
cd back

# Ver estado de migraciones
npx prisma migrate status

# Marcar migración fallida como rolled back
npx prisma migrate resolve --rolled-back "0001_init"

# Resetear base de datos y re-aplicar migraciones
npx prisma migrate reset --force
```

**Luego volver a ejecutar:**
```bash
npm run dev:stack
```

**Documentación completa:** `.specify/troubleshooting/prisma-migrations.md`

---

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

<p align="center">
  <strong>Built with love for small businesses in Latin America</strong>
</p>
