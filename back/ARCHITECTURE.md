# Arquitectura Hexagonal (Clean Architecture) - Backend

## Resumen

Este backend sigue la **Arquitectura Hexagonal** (también conocida como Clean Architecture o Ports and Adapters) con una separación clara entre:

- **Dominio**: Entidades, puertos (interfaces), enums, errores de dominio
- **Aplicación**: Casos de uso que contienen la lógica de negocio
- **Infraestructura**: Controladores HTTP, repositorios Prisma, adaptadores externos

## Estructura de Módulos

```
src/modules/
├── auth/           # Autenticación y autorización
├── products/       # Catálogo de productos (tienda)
├── orders/         # Órdenes y carrito
├── payments/       # Procesamiento de pagos
├── users/          # Gestión de usuarios
├── inventory/      # Inventario y stock
├── admin/          # Panel de administración
├── content/        # Contenido de la tienda (banners)
├── audit/          # Auditoría
└── health/         # Health checks
```

## Estructura Interna de cada Módulo

```
modules/[nombre]/
├── domain/
│   ├── ports/              # Interfaces de repositorios (contratos)
│   │   └── [nombre].port.ts
│   └── enums/              # Enums específicos del dominio
│       └── [nombre].enum.ts
├── application/
│   └── use-cases/          # Casos de uso (lógica de negocio)
│       ├── [nombre].use-case.ts
│       └── index.ts        # Barrel exports
├── infrastructure/
│   ├── http/               # Controladores y DTOs
│   │   ├── [nombre].controller.ts
│   │   └── dto/
│   └── persistence/        # Implementaciones de repositorios
│       └── prisma-[nombre].repository.ts
└── [nombre].module.ts      # Definición del módulo NestJS
```

## Principios Clave

### 1. Casos de Uso (Use Cases)

Cada caso de uso:
- Tiene una única responsabilidad
- Depende de puertos (interfaces), no de implementaciones concretas
- Contiene la lógica de negocio
- Usa inyección de dependencias con tokens

```typescript
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(dto: CreateProductDto) {
    // Validaciones de negocio
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) throw new NotFoundError('Category not found');

    // Lógica de negocio
    return this.productRepository.create({ ...dto });
  }
}
```

### 2. Puertos (Ports)

Los puertos definen contratos que el dominio necesita:

```typescript
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  // ...
}
```

### 3. Inyección de Dependencias

Usamos tokens de inyección para desacoplar:

```typescript
@Module({
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    CreateProductUseCase,
  ],
})
```

### 4. Barrel Exports

Cada módulo debe exportar sus use cases desde un `index.ts`:

```typescript
// application/use-cases/index.ts
export { CreateProductUseCase } from './create-product.use-case';
export { GetProductsUseCase } from './get-products.use-case';
```

## Mejores Prácticas

### Anti-patrones a evitar

❌ **God Services**: Servicios que manejan múltiples responsabilidades
```typescript
// MALO
@Injectable()
export class AdminService {
  // 600+ líneas manejando users, orders, products, categories...
}
```

✅ **Use Cases enfocados**: Un caso de uso por responsabilidad
```typescript
// BUENO
@Injectable()
export class GetDashboardSummaryUseCase { /* solo dashboard */ }

@Injectable()
export class CreateUserUseCase { /* solo crear usuarios */ }
```

❌ **Dependencias cruzadas entre módulos**
```typescript
// MALO
// ProductsModule importa desde AdminModule
import { GetHomeBannersUseCase } from '../admin/...';
```

✅ **Módulos compartidos**
```typescript
// BUENO
// Nuevo ContentModule para funcionalidad compartida
import { GetHomeBannersUseCase } from '../content/...';
```

❌ **Use cases que solo delegan**
```typescript
// MALO
@Injectable()
export class GetUsersUseCase {
  constructor(private readonly adminService: AdminService) {}
  execute() {
    return this.adminService.getUsers(); // Solo delega
  }
}
```

✅ **Use cases con lógica de negocio**
```typescript
// BUENO
@Injectable()
export class GetUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort) {}
  async execute(page: number, limit: number) {
    // Lógica de paginación aquí
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.userRepo.list({ page: safePage, limit: safeLimit });
  }
}
```

## Estado Actual de Refactorización

### ✅ Completado

1. **Arquitectura base**: 98+ casos de uso implementados
2. **ContentModule creado**: Eliminada dependencia cruzada Products -> Admin
3. **Refactorización de use cases clave**: Dashboard, Users, Products, Orders

### ⏳ Pendiente

1. **19 use cases en admin** aún dependen de AdminService (lista abajo)
2. **InventoryService** actúa como facade - evaluar si necesita refactorización
3. **Agregar barrel exports** faltantes
4. **Eliminar AdminService** una vez todos los use cases sean independientes

## Lista de Use Cases Pendientes de Refactorización (Admin)

Los siguientes use cases aún dependen de `AdminService` y deben ser refactorizados:

```
update-user-status.use-case.ts
update-user-role.use-case.ts
update-product-status.use-case.ts
update-payment-status.use-case.ts
update-order-notes.use-case.ts
update-country.use-case.ts
update-category.use-case.ts
get-user-by-id.use-case.ts
get-top-products.use-case.ts
get-sales-chart.use-case.ts
get-recent-orders.use-case.ts
get-product-by-id.use-case.ts
get-order-by-id.use-case.ts
get-countries.use-case.ts
get-category-by-id.use-case.ts
delete-user.use-case.ts
delete-country.use-case.ts
delete-category.use-case.ts
create-country.use-case.ts
```

### Patrón de refactorización

1. Reemplazar inyección de AdminService con los puertos necesarios
2. Mover la lógica de negocio desde AdminService al use case
3. Actualizar AdminModule para remover AdminService cuando ya no se use

Ejemplo:
```typescript
// ANTES
constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

// DESPUÉS
constructor(
  @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  @Inject(ADMIN_AUDIT_REPOSITORY) private readonly auditRepository: AdminAuditRepositoryPort,
) {}
```

## Comandos Útiles

```bash
# Verificar compilación TypeScript
npx tsc --noEmit

# Ejecutar tests
npm test

# Ejecutar linter
npm run lint
```

## Decisiones Arquitectónicas

### ¿Por qué Use Cases en lugar de Services?

- **Single Responsibility**: Cada use case hace una cosa
- **Testabilidad**: Fácil de mockear dependencias
- **Escalabilidad**: Nuevos requerimientos = nuevos use cases, no modificar servicios existentes
- **Traceability**: Cada operación de negocio está explícita

### ¿Por qué Ports and Adapters?

- **Desacoplamiento**: El dominio no depende de infraestructura
- **Testabilidad**: Podemos mockear repositorios en tests
- **Flexibilidad**: Podemos cambiar Prisma por otra ORM sin tocar use cases
- **Clean boundaries**: Fronteras claras entre capas

## Referencias

- [NestJS Best Practices](https://docs.nestjs.com)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
