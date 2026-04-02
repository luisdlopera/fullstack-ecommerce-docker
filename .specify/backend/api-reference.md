# API Reference

## Base Configuration

- **Base URL**: `http://localhost:5001/api` (development)
- **Global Prefix**: `/api` (set in `main.ts`)
- **Version**: `/api/v1` (recommended)
- **Swagger**: `http://localhost:5001/api/docs`
- **Health**: `GET /api/health`

## Response Format

### Success (200 OK)
```json
{
  "data": { ... }
}
```

### List Response (200 OK)
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | JWT missing or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

## Public Endpoints

### Products

```
GET /api/products/featured
# Returns: Featured products array

GET /api/products
# Query: page, limit, query, gender, categories[], sizes[], 
#        minPrice, maxPrice, mustTag, anyTags, colSlugs[], avail
# Returns: Paginated product list

GET /api/products/:slug
# Returns: Product detail with images, category

GET /api/products/:slug/stock
# Returns: Stock availability for product
```

### Categories

```
GET /api/categories
# Returns: All active categories with hierarchy
```

### Countries

```
GET /api/countries
# Returns: Countries with shipping/purchase enabled
```

### Authentication

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { user, tokens }

POST /api/auth/register
Body: { name: string, email: string, password: string }
Response: { user, tokens }

POST /api/auth/refresh
Body: { refreshToken: string }
Response: { accessToken, refreshToken }

POST /api/auth/logout
Headers: Authorization: Bearer {accessToken}
Response: 200 OK
```

## Authenticated Endpoints

Require `Authorization: Bearer {accessToken}` header.

### User Profile

```
GET /api/auth/me
# Returns: Current user profile

GET /api/users/me/address
# Returns: User addresses

POST /api/users/me/address
Body: { firstName, lastName, address, address2?, postalCode, 
        city, phone, countryId }
# Returns: Created address

PUT /api/users/me/address/:id
Body: { ...address fields }
# Returns: Updated address

DELETE /api/users/me/address/:id
# Returns: 200 OK
```

### Favorites

```
GET /api/users/me/favorites
# Returns: User's favorite products

POST /api/users/me/favorites
Body: { productId: string }
# Returns: Created favorite

DELETE /api/users/me/favorites/:productId
# Returns: 200 OK
```

### Orders

```
GET /api/orders
# Query: page, limit, status
# Returns: User's orders (customer view)

GET /api/orders/:id
# Returns: Order details with items

POST /api/orders
Body: {
  items: [{ productId, quantity, size }],
  address: { ... },
  guestEmail?,  // For guest checkout
  couponCode?
}
# Returns: Created order
```

### Payments

```
POST /api/payments/mercadopago/create
Body: { orderId: string }
# Returns: MercadoPago preference/init point

POST /api/payments/mercadopago/webhook
# MercadoPago webhook (public, IP verified)
Body: { payment_id, status, external_reference }
```

## Admin Endpoints

Require `Authorization: Bearer {accessToken}` + `Role.ADMIN` or higher.

### Dashboard

```
GET /api/admin/dashboard
# Returns: Stats (orders, revenue, low stock alerts)
```

### Products

```
GET /api/admin/products
# Query: page, limit, search, isActive
# Returns: All products (admin view)

POST /api/admin/products
Body: {
  title, description, price, comparePrice?, sku?, 
  sizes[], gender, tags[], categoryId, featured?, isActive?
}
# Returns: Created product

GET /api/admin/products/:id
# Returns: Product with full details

PATCH /api/admin/products/:id
Body: { ...product fields }
# Returns: Updated product

DELETE /api/admin/products/:id
# Soft delete (sets deletedAt)
# Returns: 200 OK
```

### Product Images

```
POST /api/admin/products/:id/images
Content-Type: multipart/form-data
Body: { file: File, makePrimary?: boolean }
# Returns: Uploaded image metadata

DELETE /api/admin/products/:id/images/:imageId
# Returns: 200 OK
```

### Categories

```
POST /api/admin/categories
Body: { name, slug, description?, parentId?, image? }

PATCH /api/admin/categories/:id
Body: { ...category fields }

DELETE /api/admin/categories/:id
```

### Inventory

```
GET /api/admin/inventory/summary
# Returns: Aggregated inventory stats

GET /api/admin/inventory/items
# Query: page, limit, search, lowStock, outOfStock, productId, location
# Returns: Inventory items

GET /api/admin/inventory/items/:id
# Returns: Inventory item with movements

GET /api/admin/inventory/products/:productId
# Returns: All inventory for product

PATCH /api/admin/inventory/items/:id/adjust
Body: { quantity: number, reason: string }
# Returns: Updated inventory

GET /api/admin/inventory/movements
# Query: page, limit, inventoryItemId, type, referenceId
# Returns: Stock movements

GET /api/admin/inventory/alerts/low-stock
# Returns: Items with available <= minStock

GET /api/admin/inventory/alerts/out-of-stock
# Returns: Items with available = 0
```

### Warehouses

```
GET /api/admin/warehouses
POST /api/admin/warehouses
Body: { name, code, location?, isActive? }

GET /api/admin/warehouses/:id
PATCH /api/admin/warehouses/:id
Body: { ...warehouse fields }
```

### Orders (Admin View)

```
GET /api/admin/orders
# Query: page, limit, status, paymentStatus, search
# Returns: All orders (admin view)

GET /api/admin/orders/:id
# Returns: Order with full details

PATCH /api/admin/orders/:id/status
Body: { status: OrderStatus }
# Returns: Updated order

PATCH /api/admin/orders/:id/internal-notes
Body: { internalNotes: string }
```

### Users

```
GET /api/admin/users
# Query: page, limit, search, role, isActive
# Returns: User list

GET /api/admin/users/:id
PATCH /api/admin/users/:id
Body: { name?, role?, isActive? }
```

## Query Parameters Reference

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Product Filters
- `query`: Text search (title, description)
- `gender`: men | women | kid | unisex
- `categories[]`: Category IDs
- `sizes[]`: XS, S, M, L, XL, XXL, XXXL
- `minPrice`, `maxPrice`: Price range
- `mustTag`: Require specific tag
- `anyTags[]`: Include any of tags
- `colSlugs[]`: Collection slugs
- `avail`: Availability filter
- `inStock`: Legacy boolean (maintain backwards compat)

### Inventory Filters
- `lowStock`: boolean - Items below threshold
- `outOfStock`: boolean - Items with zero stock
- `location`: Warehouse code filter

## Authentication

### JWT Flow

1. **Login/Register**: Receive `accessToken` (15min) + `refreshToken` (7d)
2. **Authenticated Requests**: Include `Authorization: Bearer {accessToken}`
3. **Token Expiry**: Call `/auth/refresh` with `refreshToken`
4. **Logout**: Invalidates refresh token family

### Cookie-Based (Frontend)

Next.js BFF uses httpOnly cookies:
- `nexstore_access`: Access token
- `nexstore_refresh`: Refresh token

Frontend calls BFF routes which proxy to NestJS with cookies.

## Rate Limiting

API includes throttling via `@nestjs/throttler`:
- Default: 100 requests per 15 minutes per IP
- Auth endpoints: 10 requests per minute (login/register)

See [security/auth-flow.md](../security/auth-flow.md) for details.
