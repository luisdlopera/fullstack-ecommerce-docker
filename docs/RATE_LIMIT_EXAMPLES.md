# Ejemplos de Uso - Rate Limiting Avanzado

Guía práctica con ejemplos reales para implementar rate limiting en los controladores.

## 📋 Índice

1. [Ejemplos Básicos](#ejemplos-básicos)
2. [Control de Autenticación](#control-de-autenticación)
3. [Endpoints Sensibles](#endpoints-sensibles)
4. [Exclusiones](#exclusiones)
5. [Rate Limit por Usuario](#rate-limit-por-usuario)
6. [Testing](#testing)

---

## Ejemplos Básicos

### 1. Usar Rate Limit Automático (Default)

No necesitas hacer nada. El sistema aplica rate limiting automáticamente basado en la ruta:

```typescript
@Controller('products')
export class ProductsController {
  // Usa límite global por IP o límite de usuario autenticado
  @Get()
  findAll() {
    return this.productService.findAll();
  }
}
```

**Límites aplicados:**
- Usuario anónimo: 100 req/min por IP
- Usuario autenticado: 200 req/min por userId

### 2. Endpoint con Límite Estricto

Para operaciones costosas o sensibles:

```typescript
import { StrictRateLimit } from '../../rate-limit/infrastructure/decorators/rate-limit.decorator';

@Controller('reports')
export class ReportsController {
  
  @StrictRateLimit()
  @Post('generate')
  generateReport() {
    // Operación costosa
    return this.reportService.generate();
  }
}
```

**Límites aplicados:** 5 requests / 5 minutos (usando config auth)

### 3. Endpoint Personalizado

Para casos específicos:

```typescript
import { RateLimit } from '../../rate-limit/infrastructure/decorators/rate-limit.decorator';

@Controller('api')
export class MyController {
  
  @RateLimit({ 
    limit: 10, 
    ttl: 60, 
    policy: 'custom',
    message: 'Please slow down, you can only export 10 times per minute.'
  })
  @Post('export')
  exportData() {
    return this.exportService.export();
  }
}
```

---

## Control de Autenticación

### Login con Protección Brute Force

```typescript
import { StrictRateLimit } from '../../rate-limit/infrastructure/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  
  // El sistema detecta automáticamente rutas de auth
  // Pero puedes reforzar con @StrictRateLimit
  @StrictRateLimit()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

**Comportamiento:**
- Límite: 5 intentos / 5 minutos
- Key: `rl:auth:login:ip:{clientIp}`
- Respuesta 429 después del límite con `retryAfter: 300`

### Register Protegido

```typescript
@StrictRateLimit()
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

---

## Endpoints Sensibles

### Webhooks (Excluir Rate Limit)

```typescript
import { SkipRateLimit } from '../../rate-limit/infrastructure/decorators/rate-limit.decorator';

@Controller('webhooks')
export class WebhooksController {
  
  @SkipRateLimit()
  @Post('stripe')
  handleStripeWebhook(@Body() payload: StripeEvent) {
    return this.webhookService.handleStripe(payload);
  }
}
```

**Nota:** Usa esto solo para webhooks de terceros confiables que no manejen bien 429.

### Health Checks (Ya Excluido)

```typescript
@Controller('health')
export class HealthController {
  
  // Automáticamente excluido por el sistema
  // No necesitas @SkipRateLimit()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

**Rutas excluidas automáticamente:**
- `/health`
- `/ping`
- `/status`
- `/metrics`
- `/prometheus`

---

## Rate Limit por Usuario

### Más Permisivo para Usuarios Autenticados

```typescript
import { RateLimit } from '../../rate-limit/infrastructure/decorators/rate-limit.decorator';

@Controller('uploads')
export class UploadsController {
  
  // Usuarios autenticados tienen límite separado (más alto)
  @RateLimit({ type: 'user', limit: 50, ttl: 60 })
  @Post('file')
  @UseGuards(JwtAuthGuard)
  uploadFile(@CurrentUser() user: JwtPayload, @UploadedFile() file: File) {
    return this.uploadService.upload(user.sub, file);
  }
}
```

**Key generada:** `rl:user:user:{userId}:tenant:default`

### Límite por Ruta + IP

```typescript
@RateLimit({ type: 'route', limit: 20, ttl: 60 })
@Get('search')
search(@Query('q') query: string) {
  return this.searchService.search(query);
}
```

**Key generada:** `rl:route:route:get:/search:ip:{clientIp}`

---

## Monitoreo y Admin

### Endpoint de Health del Rate Limiter

```bash
# Verificar estado del sistema de rate limiting
curl http://localhost:5007/api/rate-limit/health

# Respuesta:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "rateLimit": {
    "enabled": true,
    "storage": "redis",
    "storeStatus": "connected",
    "storeStats": {
      "connected": true,
      "keysCount": 1234
    }
  }
}
```

### Ver Configuración Actual (Admin)

```bash
# Requiere JWT con rol ADMIN o SUPER_ADMIN
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5007/api/rate-limit/config

# Respuesta:
{
  "enabled": true,
  "storage": "redis",
  "trustProxy": true,
  "limits": {
    "global": { "ttl": 60, "limit": 100 },
    "auth": { "ttl": 300, "limit": 5 },
    "refresh": { "ttl": 60, "limit": 10 },
    "public": { "ttl": 60, "limit": 60 },
    "admin": { "ttl": 60, "limit": 200 },
    "authenticated": { "ttl": 60, "limit": 200 }
  }
}
```

### Resetear Rate Limit (Super Admin)

```bash
# Resetear un IP específico
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5007/api/rate-limit/reset?pattern=ip:192.168.1.1:*"

# Resetear todos los rate limits de un tenant
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5007/api/rate-limit/reset?pattern=tenant:acme:*"
```

---

## Testing

### Probar Límite Global

```bash
# Hacer 101 requests rápidamente
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:5007/api/products
done

# Deberías ver:
# 200 (100 veces)
# 429 (1 vez)
```

### Protección Brute Force

```bash
# Intentar login 6 veces
for i in {1..6}; do
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    http://localhost:5007/api/auth/login
done

# La 6ª debe retornar 429 Too Many Requests
```

### Ver Headers

```bash
# Hacer request y ver headers de rate limit
curl -s -D - -o /dev/null \
  http://localhost:5007/api/products | grep -i ratelimit

# Salida esperada:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 60
# X-RateLimit-Policy: global
```

---

## Mejores Prácticas

### 1. No Desactivar Rate Limit en Producción

```env
# ❌ Nunca hacer esto en producción:
RATE_LIMIT_ENABLED=false

# ✅ Siempre habilitado:
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORAGE=redis
```

### 2. Usar Redis en Producción

```yaml
# docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
```

```env
RATE_LIMIT_STORAGE=redis
REDIS_URL=redis://redis:6379
```

### 3. Ajustar Límites Según Tu App

```env
# API pública con mucho tráfico anónimo:
RATE_LIMIT_GLOBAL_LIMIT=200
RATE_LIMIT_AUTH_USER_LIMIT=500

# API interna/enterprise:
RATE_LIMIT_GLOBAL_LIMIT=50
RATE_LIMIT_AUTH_USER_LIMIT=1000
```

### 4. Monitorear Headers

En tu frontend o clientes, siempre lee los headers:

```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
if (remaining && parseInt(remaining) < 5) {
  console.warn('Approaching rate limit');
}
```

### 5. Manejar Errores 429

```javascript
try {
  const response = await fetch('/api/login', { method: 'POST', body });
  
  if (response.status === 429) {
    const error = await response.json();
    const retryAfter = error.retryAfter;
    
    alert(`Too many attempts. Please wait ${retryAfter} seconds.`);
  }
} catch (error) {
  // Handle error
}
```

---

## Resumen de Keys Generadas

| Tipo | Key Pattern | Ejemplo |
|------|-------------|---------|
| Global IP | `rl:global:ip:{ip}` | `rl:global:ip:192.168.1.1` |
| Tenant IP | `rl:tenant:tenant:{tenant}:ip:{ip}` | `rl:tenant:tenant:acme:ip:192.168.1.1` |
| User | `rl:user:user:{userId}:tenant:{tenant}` | `rl:user:user:123:tenant:acme` |
| Auth | `rl:auth:{action}:ip:{ip}` | `rl:auth:login:ip:192.168.1.1` |
| Custom | `rl:{policy}:...` | `rl:custom:route:upload` |

---

## Soporte

Para más información, consulta:
- Documentación técnica: `docs/RATE_LIMITING_SYSTEM.md`
- Código fuente: `src/rate-limit/`
- Tests E2E: `test/rate-limit.e2e-spec.ts`
