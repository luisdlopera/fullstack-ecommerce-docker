# Sistema de Auditoría - Guía de Uso

Sistema completo de auditoría para trackear todas las acciones importantes del sistema.

## Componentes

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `AuditService` | `shared/application/audit.service.ts` | Servicio principal para registrar y consultar logs |
| `AuditInterceptor` | `shared/infrastructure/audit/audit.interceptor.ts` | Interceptor para auto-loggear operaciones HTTP |
| `@Audit()` | `shared/infrastructure/audit/audit.decorator.ts` | Decorador para marcar métodos a auditar |
| `AuditController` | `shared/infrastructure/http/audit.controller.ts` | Endpoints para consultar logs (solo admins) |
| `AuditRepositoryPort` | `shared/domain/ports/audit-repository.port.ts` | Puerto para persistencia |

## Métodos de Uso

### 1. Uso Directo del AuditService (Recomendado para casos de uso)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { AuditService } from '../../../shared/application/audit.service';
import { AuditEntityType } from '../../../shared/domain/ports/audit-repository.port';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async execute(userId: string, dto: CreateProductDto) {
    // ... crear producto
    const product = await this.productRepository.create(dto);

    // Registrar auditoría
    await this.auditService.record({
      userId,
      action: 'PRODUCT_CREATED',
      entityType: AuditEntityType.PRODUCT,
      entityId: product.id,
      metadata: {
        name: product.name,
        price: product.price,
        category: product.categoryId,
      },
    });

    return product;
  }
}
```

### 2. Métodos Helper del AuditService

```typescript
// Login exitoso
await this.auditService.recordLogin(userId, request);

// Login fallido
await this.auditService.recordFailedLogin(email, request, 'Invalid password');

// Creación con helper
await this.auditService.recordCreate(
  userId,
  AuditEntityType.PRODUCT,
  product.id,
  { name: product.name, price: product.price },
  request,
);

// Actualización con tracking de cambios
await this.auditService.recordUpdate(
  userId,
  AuditEntityType.PRODUCT,
  product.id,
  oldProduct,  // datos antes de la modificación
  newProduct,  // datos después de la modificación
  request,
);

// Eliminación
await this.auditService.recordDelete(
  userId,
  AuditEntityType.PRODUCT,
  product.id,
  product,  // datos completos del objeto eliminado
  request,
);

// Acción de administrador
await this.auditService.recordAdminAction(
  adminId,
  'USER_ROLE_CHANGED',
  targetUserId,
  { oldRole: 'CUSTOMER', newRole: 'MANAGER' },
  request,
);
```

### 3. Uso con Decorador @Audit() (Auto-loggear)

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Audit } from '../../../shared/infrastructure/audit/audit.decorator';
import { AuditEntityType } from '../../../shared/domain/ports/audit-repository.port';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../../../shared/infrastructure/audit/audit.interceptor';

@Controller('products')
@UseInterceptors(AuditInterceptor)  // Aplicar interceptor
export class ProductsController {

  @Post()
  @Audit({
    entityType: AuditEntityType.PRODUCT,
    action: 'PRODUCT_CREATED',
    entityIdExtractor: (result) => result.id,
    metadataExtractor: (result) => ({
      name: result.name,
      price: result.price,
    }),
  })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
```

## Endpoints de Consulta

Los endpoints están protegidos y requieren rol ADMIN, MANAGER o SUPER_ADMIN.

### Obtener logs (paginado)

```http
GET /audit?page=1&limit=20&entityType=PRODUCT&action=PRODUCT_CREATED
Authorization: Bearer <token>
```

Parámetros de query:
- `page`: Número de página (default: 1)
- `limit`: Items por página (max: 100, default: 20)
- `userId`: Filtrar por usuario específico
- `entityType`: Tipo de entidad (PRODUCT, ORDER, USER, etc)
- `entityId`: ID de entidad específica
- `action`: Nombre de la acción (ej: PRODUCT_CREATED)
- `startDate`: Fecha inicio (ISO 8601)
- `endDate`: Fecha fin (ISO 8601)

### Obtener logs de una entidad

```http
GET /audit/entity/PRODUCT/prod-123?page=1&limit=20
Authorization: Bearer <token>
```

### Obtener actividad de un usuario

```http
GET /audit/user/user-123?page=1&limit=20
Authorization: Bearer <token>
```

### Obtener estadísticas

```http
GET /audit/stats?days=30
Authorization: Bearer <token>
```

Respuesta:
```json
{
  "totalActions": 150,
  "actionsByType": {
    "PRODUCT_CREATED": 45,
    "ORDER_CREATED": 32,
    "USER_LOGIN": 73
  },
  "topUsers": [
    { "userId": "user-1", "count": 45 },
    { "userId": "user-2", "count": 32 }
  ]
}
```

## Tipos de Entidad Disponibles

```typescript
enum AuditEntityType {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  INVENTORY = 'inventory',
  PAYMENT = 'payment',
  CATEGORY = 'category',
  AUTH = 'auth',
}
```

## Buenas Prácticas

### 1. Registrar siempre en casos de uso, no en controllers

✅ **Bien**:
```typescript
// En el use case
async execute(userId: string, dto: CreateProductDto) {
  const product = await this.repository.create(dto);
  await this.auditService.recordCreate(userId, AuditEntityType.PRODUCT, product.id, product);
  return product;
}
```

❌ **Evitar**:
```typescript
// En el controller
@Post()
async create(@Body() dto: CreateProductDto) {
  const product = await this.useCase.execute(dto);
  await this.auditService.recordCreate(...); // Esto va en el use case
  return product;
}
```

### 2. Incluir datos relevantes en metadata

✅ **Bien**:
```typescript
metadata: {
  name: product.name,
  price: product.price,
  changes: ['price: $10 → $15'],
}
```

❌ **Evitar**:
```typescript
metadata: {
  product: product, // No incluir objetos completos
}
```

### 3. Usar nombres de acción consistentes

Formato: `{ENTITY}_{ACTION}_{RESULT?}`

- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `ORDER_STATUS_CHANGED`
- `USER_LOGIN_FAILED`
- `INVENTORY_ADJUSTED`

### 4. Siempre incluir request para IP y UserAgent

```typescript
await this.auditService.record({
  userId,
  action: 'PRODUCT_CREATED',
  entityType: AuditEntityType.PRODUCT,
  entityId: product.id,
  request,  // ← incluir siempre
});
```

### 5. Para operaciones sensibles, loggear intentos fallidos

```typescript
async updateOrderStatus(userId: string, orderId: string, newStatus: OrderStatus) {
  try {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      await this.auditService.record({
        userId,
        action: 'ORDER_STATUS_CHANGE_FAILED',
        entityType: AuditEntityType.ORDER,
        entityId: orderId,
        metadata: { reason: 'Order not found', attemptedStatus: newStatus },
      });
      throw new NotFoundException('Order not found');
    }
    
    // ... actualizar orden
  } catch (error) {
    await this.auditService.record({
      userId,
      action: 'ORDER_STATUS_CHANGE_FAILED',
      entityType: AuditEntityType.ORDER,
      entityId: orderId,
      metadata: { 
        error: error.message,
        attemptedStatus: newStatus,
      },
    });
    throw error;
  }
}
```

## Integración con Sistema Actual

El sistema de auditoría ya está integrado en los siguientes casos de uso:

- `AdjustStockUseCase` - Registra ajustes de inventario
- `CreateOrderUseCase` - Registra creación de órdenes
- `ProcessPaymentUseCase` - Registra pagos

Para agregar auditoría a nuevos casos de uso, simplemente inyectar `AuditService` y llamar a `record()` o sus métodos helper.
