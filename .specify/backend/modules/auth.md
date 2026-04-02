# Auth Module

## Purpose

Handles authentication, JWT management, and session control for the e-commerce platform.

## Responsibilities

- User login/logout
- JWT access/refresh token lifecycle
- Password hashing (bcryptjs)
- Multi-factor authentication (MFA) support
- Token rotation and revocation
- Guest checkout token generation

## Architecture

```
modules/auth/
├── domain/
│   └── ports/
│       ├── auth-repository.port.ts
│       └── token.service.port.ts
├── application/
│   ├── use-cases/
│   │   ├── login.use-case.ts
│   │   ├── register.use-case.ts
│   │   ├── refresh-token.use-case.ts
│   │   ├── logout.use-case.ts
│   │   └── validate-mfa.use-case.ts
│   └── auth.service.ts
├── infrastructure/
│   ├── http/
│   │   ├── auth.controller.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── refresh-token.dto.ts
│   ├── persistence/
│   │   └── prisma-auth.repository.ts
│   └── security/
│       ├── jwt-token.service.ts
│       └── password.service.ts
└── auth.module.ts
```

## Use Cases

### Login

Validates credentials and issues JWT pair.

```typescript
// POST /api/auth/login
class LoginUseCase {
  async execute(dto: LoginDto): Promise<AuthResponse> {
    // 1. Find user by email
    // 2. Validate password with bcrypt
    // 3. Check if MFA required
    // 4. Generate access + refresh tokens
    // 5. Store refresh token hash
    // 6. Return tokens + user
  }
}
```

### Register

Creates new user with hashed password.

```typescript
// POST /api/auth/register
class RegisterUseCase {
  async execute(dto: RegisterDto): Promise<AuthResponse> {
    // 1. Validate email uniqueness
    // 2. Check disposable email blacklist
    // 3. Verify MX record (if enabled)
    // 4. Hash password (bcrypt, 10 rounds)
    // 5. Create user with CUSTOMER role
    // 6. Generate and return tokens
  }
}
```

### Refresh Token

Issues new access token using valid refresh token.

```typescript
// POST /api/auth/refresh
class RefreshTokenUseCase {
  async execute(refreshToken: string): Promise<TokenPair> {
    // 1. Verify refresh token signature
    // 2. Check if not revoked
    // 3. Validate token family
    // 4. Rotate: create new token pair
    // 5. Revoke old refresh token
    // 6. Return new tokens
  }
}
```

### Logout

Revokes refresh token family.

```typescript
// POST /api/auth/logout (protected)
class LogoutUseCase {
  async execute(userId: string, tokenJti: string): Promise<void> {
    // 1. Revoke all tokens in family
    // 2. Clear any server-side session data
  }
}
```

## JWT Configuration

### Token Structure

**Access Token** (15 minutes):
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "jti": "unique-token-id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Refresh Token** (7 days):
```json
{
  "sub": "user-uuid",
  "jti": "unique-token-id",
  "familyId": "family-uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Environment Variables

```env
JWT_SECRET=openssl-rand-hex-64-minimum
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

## Security Features

### Password Requirements

- Minimum 8 characters
- Requires uppercase, lowercase, number, special char
- bcryptjs hashing (10 salt rounds)

### Token Rotation

- Each refresh issues new token pair
- Old refresh tokens revoked
- Prevents refresh token replay attacks

### MFA Support

- TOTP-based (speakeasy library)
- Optional per user (`mfaEnabled` flag)
- Recovery codes generated on setup

### Email Security

- Disposable email domain blacklist
- MX record verification (optional)
- Email verification tokens (24h expiry)

## Guards

### JwtAuthGuard

Validates access token on protected routes.

```typescript
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {}
```

Skip with `@Public()`:
```typescript
@Public()
@Post('login')
login() { }
```

### RolesGuard

Checks user role against required permissions.

```typescript
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {}
```

## Controllers

### AuthController

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/login | Authenticate user | Public |
| POST | /api/auth/register | Create account | Public |
| POST | /api/auth/refresh | Get new tokens | Public |
| GET | /api/auth/me | Current user | Required |
| POST | /api/auth/logout | Revoke tokens | Required |
| POST | /api/auth/mfa/setup | Enable MFA | Required |
| POST | /api/auth/mfa/verify | Validate TOTP | Required |

## Database Schema

### RefreshToken

```prisma
model RefreshToken {
  id            String    @id @default(uuid())
  token         String    @unique
  tokenHash     String?   @unique
  jti           String?   @unique      // Token unique ID
  familyId      String?                // Token family for rotation
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt     DateTime
  revokedAt     DateTime?
  replacedByJti String?                // Tracks rotation
  userAgentHash String?                // Fingerprinting
  ipHash        String?
  createdAt     DateTime  @default(now())
  lastUsedAt    DateTime  @default(now())
}
```

### PasswordResetToken

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  // 1 hour
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

### EmailVerificationToken

```prisma
model EmailVerificationToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  // 24 hours
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

## BFF Integration

Frontend uses Next.js BFF routes that:
1. Receive credentials from browser
2. Call NestJS auth endpoints
3. Set httpOnly cookies with tokens
4. Return user data (no tokens exposed to JS)

See [frontend/auth-flow.md](../frontend/auth-flow.md) for frontend implementation.

## Testing

### Unit Tests

```typescript
// Mock repository and services
const mockAuthRepo = {
  findByEmail: jest.fn(),
  createRefreshToken: jest.fn(),
};

// Test login flow
it('should return tokens on valid credentials', async () => {
  // Arrange
  mockAuthRepo.findByEmail.mockResolvedValue(mockUser);
  
  // Act
  const result = await loginUseCase.execute(credentials);
  
  // Assert
  expect(result.accessToken).toBeDefined();
  expect(result.refreshToken).toBeDefined();
});
```

See [testing/jest-backend.md](../testing/jest-backend.md) for testing patterns.

## References

- [API Reference](./api-reference.md#authentication)
- [Security Auth Flow](../security/auth-flow.md)
- [Frontend Auth](../frontend/auth-flow.md)
