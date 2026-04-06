# Estandarización de Puertos - Nexstore Monorepo

## Esquema Oficial de Puertos

| Servicio | Puerto | Variable de Entorno | Descripción |
|----------|--------|---------------------|-------------|
| **Frontend** | 5006 | `FRONTEND_PORT` | Next.js dev server |
| **Backend** | 5007 | `BACKEND_PORT` | NestJS API |
| **Database** | 5008 | `DATABASE_PORT` | PostgreSQL |
| **Redis** | 5009 | `REDIS_PORT` | Cache/Queue |

### Alias Legacy (Backwards Compatibility)

- `FRONT_PORT` → `FRONTEND_PORT`
- `BACK_PORT` → `BACKEND_PORT`
- `POSTGRES_PORT` → `DATABASE_PORT`

## Diferencia: Host vs Contenedor

### Puertos en Host (tu máquina)

```
Frontend:    http://localhost:5006
Backend:     http://localhost:5007/api
PostgreSQL:  localhost:5008
Redis:       localhost:5009
```

### Puertos Internos de Contenedores (Docker)

```
postgres:    5432 (interno)
redis:       6379 (interno)
backend:     5007 (host) → 5007 (contenedor)
frontend:    5006 (host) → 5006 (contenedor)
```

## Variables de Entorno Requeridas

### Root `.env`

```env
# ============================================
# 1. PORTS
# ============================================
FRONTEND_PORT=5006
BACKEND_PORT=5007
DATABASE_PORT=5008
REDIS_PORT=5009

# ============================================
# 2. URLs (construidas desde puertos)
# ============================================
FRONTEND_URL=http://localhost:${FRONTEND_PORT}
NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}/api
INTERNAL_API_URL=http://localhost:${BACKEND_PORT}/api
DATABASE_URL=postgresql://user:pass@localhost:${DATABASE_PORT}/db
REDIS_URL=redis://localhost:${REDIS_PORT}
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5007/api
INTERNAL_API_URL=http://localhost:5007/api
```

### Backend `.env`

```env
PORT=5007
DATABASE_URL=postgresql://user:pass@localhost:5008/db
REDIS_URL=redis://localhost:5009
FRONTEND_URL=http://localhost:5006
```

## Reglas Anti-Hardcoding

### ❌ PROHIBIDO

```typescript
// NUNCA hardcodear puertos
const apiUrl = 'http://localhost:5007/api';
app.listen(5007);
fetch('http://localhost:5006/login');
```

### ✅ OBLIGATORIO

```typescript
// SIEMPRE usar variables de entorno
const port = process.env.BACKEND_PORT || '5007';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || buildFallbackUrl();
app.listen(process.env.PORT || 5007);
```

## Cómo Cambiar Puertos

Si necesitas usar puertos diferentes:

1. **Copiar template:**
   ```bash
   cp .env.example .env
   cp back/.env.example back/.env
   cp front/.env.example front/.env.local
   ```

2. **Editar solo `.env` (no los templates):**
   ```env
   FRONTEND_PORT=3006
   BACKEND_PORT=3007
   DATABASE_PORT=3008
   ```

3. **Reiniciar todo:**
   ```bash
   npm run clean:force
   npm run dev:stack
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
```

## Tests

### Puertos para Testing

| Tipo | Frontend | Backend | Database |
|------|----------|---------|----------|
| E2E Playwright | 5006 | 5007 | 5008 |
| Unit Tests | N/A | N/A | N/A |

### Configuración Playwright

```javascript
// playwright.config.mjs
const frontPort = process.env.FRONTEND_PORT || 5006;
const backPort = process.env.BACKEND_PORT || 5007;
```

## Troubleshooting

### Puerto ocupado

```bash
# Matar procesos en puertos oficiales
npm run dev:clean

# O manualmente
npx kill-port 5006 5007 5008 5009
```

### Verificar configuración

```bash
# Ver variables cargadas
node -e "console.log(process.env.FRONTEND_PORT)"

# Ver qué procesos usan los puertos
lsof -i :5006,:5007,:5008,:5009
```

## Referencias

- [Ports Spec](../../.specify/infrastructure/ports.md)
- [Docker Services](../../.specify/infrastructure/docker-services.md)
- [Environment Vars](../../.specify/infrastructure/environment-vars.md)
