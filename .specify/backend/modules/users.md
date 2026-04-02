# Users Module

## Purpose

Manages user profiles, addresses, favorites, and account-related operations.

## Responsibilities

- User profile management
- Address CRUD operations
- Favorite products
- User lookup for auth
- Account settings

## Architecture

```
modules/users/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   └── ports/
│       └── users-repository.port.ts
├── application/
│   ├── use-cases/
│   │   ├── get-user-by-id.use-case.ts
│   │   ├── update-profile.use-case.ts
│   │   ├── get-user-addresses.use-case.ts
│   │   ├── create-address.use-case.ts
│   │   ├── update-address.use-case.ts
│   │   ├── delete-address.use-case.ts
│   │   ├── add-favorite.use-case.ts
│   │   ├── remove-favorite.use-case.ts
│   │   └── get-favorites.use-case.ts
│   └── users.service.ts
├── infrastructure/
│   ├── http/
│   │   ├── users.controller.ts
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       ├── create-address.dto.ts
│   │       └── update-address.dto.ts
│   └── persistence/
│       └── prisma-users.repository.ts
└── users.module.ts
```

## Use Cases

### Get User Profile

```typescript
class GetUserByIdUseCase {
  async execute(userId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    // Exclude sensitive fields
    const { password, mfaSecret, ...profile } = user;
    return profile;
  }
}
```

### Update Profile

```typescript
class UpdateProfileUseCase {
  async execute(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<User> {
    return this.repo.update(userId, {
      name: dto.name,
      phone: dto.phone,
      image: dto.image,
    });
  }
}
```

### Address Management

```typescript
class CreateAddressUseCase {
  async execute(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<UserAddress> {
    // Validate country exists and allows shipping
    const country = await this.countryRepo.findById(dto.countryId);
    if (!country?.allowsShipping) {
      throw new BadRequestException('Shipping not available to this country');
    }

    return this.repo.createAddress(userId, dto);
  }
}

class GetUserAddressesUseCase {
  async execute(userId: string): Promise<UserAddress[]> {
    return this.repo.findAddressesByUserId(userId);
  }
}

class UpdateAddressUseCase {
  async execute(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<UserAddress> {
    // Verify ownership
    const address = await this.repo.findAddressById(addressId);
    if (address.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.repo.updateAddress(addressId, dto);
  }
}

class DeleteAddressUseCase {
  async execute(userId: string, addressId: string): Promise<void> {
    // Verify ownership
    const address = await this.repo.findAddressById(addressId);
    if (address.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.repo.deleteAddress(addressId);
  }
}
```

### Favorites

```typescript
class AddFavoriteUseCase {
  async execute(userId: string, productId: string): Promise<UserFavorite> {
    // Check product exists
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    return this.repo.addFavorite(userId, productId);
  }
}

class RemoveFavoriteUseCase {
  async execute(userId: string, productId: string): Promise<void> {
    await this.repo.removeFavorite(userId, productId);
  }
}

class GetFavoritesUseCase {
  async execute(userId: string): Promise<Product[]> {
    return this.repo.findFavoritesByUserId(userId);
  }
}
```

## Data Models

### Prisma Schema

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  password      String
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  role          Role      @default(CUSTOMER)
  image         String?
  phone         String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?

  addresses            UserAddress[]
  orders               Order[]
  refreshTokens        RefreshToken[]
  passwordResetTokens  PasswordResetToken[]
  favorites            UserFavorite[]
  stockMovements       StockMovement[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([role])
  @@index([isActive])
}

model UserAddress {
  id         String  @id @default(uuid())
  firstName  String
  lastName   String
  address    String
  address2   String?
  postalCode String
  phone      String
  city       String

  country   Country @relation(fields: [countryId], references: [id])
  countryId String

  user   User   @relation(fields: [userId], references: [id])
  userId String

  @@index([userId])
}

model UserFavorite {
  id        String   @id @default(uuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}
```

## Controllers

### User Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/auth/me | Required | Current user (via auth module) |
| PUT | /api/users/me | Required | Update profile |

### Addresses

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/users/me/address | Required | List addresses |
| POST | /api/users/me/address | Required | Add address |
| PUT | /api/users/me/address/:id | Required | Update address |
| DELETE | /api/users/me/address/:id | Required | Delete address |

### Favorites

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/users/me/favorites | Required | List favorites |
| POST | /api/users/me/favorites | Required | Add favorite |
| DELETE | /api/users/me/favorites/:productId | Required | Remove favorite |

## DTOs

### Create Address

```typescript
export class CreateAddressDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  postalCode: string;

  @IsString()
  city: string;

  @IsString()
  phone: string;

  @IsUUID()
  countryId: string;
}
```

### Update Profile

```typescript
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  image?: string;
}
```

## Frontend Integration

Frontend uses BFF routes for address management:

```typescript
// front/src/lib/api.ts
export async function getUserAddresses() {
  return bffFetch('/users/me/address');
}

export async function createAddress(address: CreateAddressData) {
  return bffFetch('/users/me/address', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}
```

See [frontend/account.md](../frontend/features/account.md) for UI implementation.

## References

- [API Reference](../api-reference.md#authenticated-endpoints)
- [Auth Module](./auth.md) - Authentication
- [Prisma Models](../prisma-models.md#user)
