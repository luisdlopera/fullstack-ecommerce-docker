# Arquitectura de Imágenes - NexStore

## 1. FLUJO DE DATOS - Carga de Imágenes (Admin → R2 → DB)

```mermaid
flowchart LR
    subgraph Admin["Panel Admin"]
        A[Usuario selecciona imagen]
        B[POST /api/products/:id/images]
    end
    
    subgraph Backend["Backend NestJS"]
        C[UploadProductImageUseCase]
        D[StorageConfig]
        E[S3CompatibleStorageAdapter]
        F[DB Prisma]
    end
    
    subgraph Storage["Cloudflare R2"]
        G[Bucket: nexstore]
    end
    
    A --> B
    B --> C
    C --> D["Lee env:<br/>STORAGE_PUBLIC_URL"]
    C --> E["upload()<br/>key: products/xxx.webp"]
    E --> G
    C --> F["Guarda:<br/>- url (completa)<br/>- storageKey<br/>- storageProvider='r2'"]
```

## 2. FLUJO DE DATOS - Visualización (DB → Frontend → Usuario)

```mermaid
flowchart LR
    subgraph Database["PostgreSQL DB"]
        A[ProductImage<br/>url: https://...<br/>storageKey: products/...<br/>storageProvider: r2]
    end
    
    subgraph API["Backend API"]
        B[GET /api/products]
        C[mapper: include ProductImage]
    end
    
    subgraph Frontend["Next.js Frontend"]
        D[map-product-card-model.ts<br/>apiProductToCardModel]
        E[getProductImageUrl()<br/>lib/assets.ts]
        F[Image component<br/>next/image]
    end
    
    subgraph Browser["Navegador"]
        G[Usuario ve imagen]
    end
    
    A --> B --> C --> D
    D --> E["Prioriza storageKey<br/>si existe"]
    E --> F["src={imageUrl}"]
    F --> G
```

## 3. ESTRATEGIA DE URLS - Antes vs Después

### ❌ ANTES (Problema)
```
┌─────────────────────────────────────────────────────────┐
│  SEED guarda URL completa hardcodeada                   │
│  → "https://xxx.r2.cloudflarestorage.com/nexstore/..." │
│                                                          │
│  Frontend usa dominio diferente                         │
│  → "https://pub-xxx.r2.dev/..."                         │
│                                                          │
│  next.config.ts solo permite *.r2.dev                   │
│  RESULTADO: ❌ Imágenes bloqueadas (400)                │
└─────────────────────────────────────────────────────────┘
```

### ✅ DESPUÉS (Solución)
```
┌─────────────────────────────────────────────────────────┐
│  SEED guarda storageKey                                 │
│  → "products/men/men-01-jacket/722606-1200-auto.webp"   │
│                                                          │
│  DB guarda: storageKey + storageProvider + url (backup)   │
│                                                          │
│  Frontend construye URL dinámica:                        │
│  → NEXT_PUBLIC_STORAGE_BASE_URL + storageKey             │
│                                                          │
│  next.config.ts permite ambos dominios:                 │
│  → *.r2.dev + *.r2.cloudflarestorage.com                │
│  RESULTADO: ✅ Imágenes funcionan correctamente          │
└─────────────────────────────────────────────────────────┘
```

## 4. ARQUITECTURA DE COMPONENTES

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐      ┌──────────────────────┐     │
│  │  ProductCard    │──────▶│ map-product-card.ts  │     │
│  │  ProductDetail  │      │  apiProductToCard()  │     │
│  │  Slider         │      └──────────┬───────────┘     │
│  └─────────────────┘                 │                 │
│                                         ▼                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │              lib/assets.ts                          ││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  getProductImageUrl(image)                   │   ││
│  │  │  ├─ Si storageKey existe:                   │   ││
│  │  │  │   return getAssetUrl(storageKey)         │   ││
│  │  │  ├─ Si no: usar url directa                 │   ││
│  │  │  └─ Fallback: placeholder                   │   ││
│  │  └──────────────────────────────────────────────┘   ││
│  │                                                      ││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  getAssetUrl(path)                           │   ││
│  │  │  return NEXT_PUBLIC_STORAGE_BASE_URL + path  │   ││
│  │  └──────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌─────────────────────────┐ │
│  │ Upload Use Case   │───▶│ StorageConfig           │ │
│  │ (admin)           │    │ STORAGE_PUBLIC_URL      │ │
│  └──────────────────┘    │ STORAGE_BUCKET          │ │
│                           └──────────┬──────────────┘ │
│                                      │                 │
│                           ┌──────────▼──────────────┐ │
│                           │ S3CompatibleStorage    │ │
│                           │ - upload()             │ │
│                           │ - getPublicUrl(key)    │ │
│                           └──────────┬──────────────┘ │
│                                      │                 │
│                           ┌──────────▼──────────────┐ │
│                           │ Prisma DB              │ │
│                           │ ProductImage table     │ │
│                           │ - url                  │ │
│                           │ - storageKey           │ │
│                           │ - storageProvider      │ │
│                           └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 5. SECUENCIA - Primera Carga de Imagen

```mermaid
sequenceDiagram
    participant Admin as Admin Panel
    participant API as Backend API
    participant Storage as StorageService
    participant R2 as Cloudflare R2
    participant DB as PostgreSQL
    
    Admin->>API: POST /products/:id/images
    Note right of Admin: Multipart form-data<br/>file: image.jpg
    
    API->>API: buildProductImageKey()
    Note right of API: Genera key:<br/>products/p1/2024/04/uuid.jpg
    
    API->>Storage: upload(key, buffer, mimeType)
    Storage->>R2: PutObjectCommand
    R2-->>Storage: OK
    Storage-->>API: OK
    
    API->>API: getPublicUrl(key)
    Note right of API: STORAGE_PUBLIC_URL + key
    
    API->>DB: INSERT ProductImage
    Note right of DB: url: https://...<br/>storageKey: products/p1/...<br/>storageProvider: r2
    
    DB-->>API: { id, url, storageKey }
    API-->>Admin: 201 Created
    Note right of Admin: { success: true,<br/>image: { id, url } }
```

## 6. SECUENCIA - Visualización en Frontend

```mermaid
sequenceDiagram
    participant Browser as Navegador
    participant FE as Next.js Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2
    
    Browser->>FE: Carga página /products
    FE->>API: GET /products
    API->>DB: SELECT * FROM Product<br/>JOIN ProductImage
    DB-->>API: [{ product..., ProductImage: [...] }]
    API-->>FE: JSON response
    
    loop Para cada producto
        FE->>FE: apiProductToCardModel()
        Note right of FE: Extrae imgs[0], imgs[1]
        
        FE->>FE: getProductImageUrl(img)
        Note right of FE: Si storageKey → getAssetUrl()<br/>Si no → usar url directa
        
        FE->>FE: getAssetUrl(storageKey)
        Note right of FE: NEXT_PUBLIC_STORAGE_BASE_URL<br/>+ storageKey
    end
    
    FE->>Browser: HTML con URLs finales
    
    loop Para cada imagen
        Browser->>R2: GET https://...r2.cloudflarestorage.com/...
        R2-->>Browser: imagen.webp
    end
```

## 7. CONFIGURACIÓN DE DOMINIOS

```
┌─────────────────────────────────────────────────────────────┐
│  next.config.ts - RemotePatterns                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                          │
│    protocol: 'https',                                       │
│    hostname: '*.r2.dev',          ← Para r2.dev buckets     │
│    pathname: '/**',                                         │
│  },                                                         │
│  {                                                          │
│    protocol: 'https',                                       │
│    hostname: '*.r2.cloudflarestorage.com',  ← Para S3 API │
│    pathname: '/**',                                         │
│  },                                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Variables de Entorno (deben coincidir)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Backend (.env):                                            │
│  STORAGE_PUBLIC_URL=https://xxx.r2.cloudflarestorage.com/  │
│                                                              │
│  Frontend (.env.local):                                     │
│  NEXT_PUBLIC_STORAGE_BASE_URL=https://xxx.r2.cloud...      │
│                                                              │
│  ✅ Mismo dominio = URLs consistentes                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 8. ESTRUCTURA DE DATOS

### ProductImage (Prisma Schema)
```typescript
model ProductImage {
  id              Int      @id @default(autoincrement())
  url             String              // URL completa (backup)
  storageProvider String?  // 'r2' | 'local' | 's3'
  storageKey      String?  @unique     // path/key en storage
  contentType     String?             // image/webp
  sizeBytes       Int?                // 12345
  altText         String?             // descripción
  sortOrder       Int      @default(0)
  isPrimary       Boolean  @default(false)
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
}
```

### Flujo de Decisión (getProductImageUrl)
```
                    ┌─────────────────┐
                    │  Imagen data?   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ¿storageKey?   │
                    │  + provider?    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │ SÍ              │ NO              │
           ▼                 ▼                 │
    ┌─────────────┐   ┌─────────────┐        │
    │ getAssetUrl │   │  ¿url HTTP?   │        │
    │ (key)       │   └──────┬──────┘        │
    └──────┬──────┘          │                 │
           │        ┌───────┴───────┐        │
           │        │ SÍ            │ NO      │
           │        ▼               ▼         │
           │   ┌─────────┐   ┌─────────────┐  │
           │   │ return  │   │ getAssetUrl │  │
           │   │ url     │   │ (url path)  │  │
           │   └─────────┘   └─────────────┘  │
           │                                 │
           └────────────────┬────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  return URL     │
                   │  final          │
                   └─────────────────┘
```
