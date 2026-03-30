# Storage de imágenes de producto

Esta implementación sigue arquitectura hexagonal y mantiene desacoplada la lógica de negocio del proveedor de objetos.

## Diseño

- Puerto: `src/shared/domain/ports/storage.port.ts`
- Adapter S3-compatible: `src/shared/infrastructure/storage/s3-compatible-storage.adapter.ts`
- Config: `src/shared/infrastructure/storage/storage.config.ts`
- Caso de uso upload: `src/modules/admin/application/use-cases/upload-product-image.use-case.ts`
- Caso de uso delete: `src/modules/admin/application/use-cases/delete-product-image.use-case.ts`
- Repositorio admin de imágenes: `src/modules/admin/domain/ports/admin-product-image.repository.port.ts`
- Adapter Prisma para imágenes: `src/modules/admin/infrastructure/persistence/prisma-admin-product-image.repository.ts`

## Flujo de upload

1. El controller de admin recibe `multipart/form-data` con campo `file`.
2. El controller delega al caso de uso `UploadProductImageUseCase`.
3. El caso de uso valida seguridad del archivo.
4. El caso de uso genera una key segura y sin depender del nombre original.
5. El caso de uso llama al puerto de storage.
6. El caso de uso persiste metadatos en `ProductImage`.
7. Se retorna el registro persistido con URL pública.

## Seguridad aplicada

- MIME permitido: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- Tamaño máximo configurable por `STORAGE_MAX_FILE_SIZE_BYTES`.
- Key generada con UUID + ruta saneada.
- No se usa el nombre original del archivo.
- Eliminación de archivo y metadato por caso de uso dedicado.

## Variables de entorno

```env
STORAGE_PROVIDER=minio
STORAGE_BUCKET=nexstore-products
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_PUBLIC_URL=http://localhost:9000/nexstore-products
STORAGE_FORCE_PATH_STYLE=true
STORAGE_MAX_FILE_SIZE_BYTES=5242880
```

## Local con MinIO

`docker-compose.yml` incluye:

- `minio`: servidor S3-compatible local
- `minio-init`: crea bucket y lo deja público en entorno local

Puertos por defecto:

- API S3: `9000`
- Console: `9001`

Credenciales por defecto local:

- Access key: `minioadmin`
- Secret key: `minioadmin`

## Demo / Producción con Cloudflare R2

Configura variables para R2 sin cambiar código de negocio:

```env
STORAGE_PROVIDER=r2
STORAGE_BUCKET=<bucket>
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<r2-access-key-id>
STORAGE_SECRET_KEY=<r2-secret-access-key>
STORAGE_PUBLIC_URL=https://<public-domain-or-r2-dev-url>
STORAGE_FORCE_PATH_STYLE=false
```

Notas:

- Si usas dominio público de Cloudflare para bucket, ese dominio va en `STORAGE_PUBLIC_URL`.
- Si usas URL dev de R2, también puede ir en `STORAGE_PUBLIC_URL`.

## Endpoints de admin

- `POST /api/admin/products/:id/images` (multipart, campo `file`, opcional `makePrimary`)
- `DELETE /api/admin/products/:id/images/:imageId`

Ejemplo `curl` upload:

```bash
curl -X POST "http://localhost:4000/api/admin/products/<productId>/images" \
  -H "Authorization: Bearer <admin_jwt>" \
  -F "file=@/ruta/imagen.webp" \
  -F "makePrimary=true"
```
