# Security Overview

## Authentication Flow

Nexstore uses JWT (JSON Web Tokens) with httpOnly cookies for secure authentication.

## JWT Token Strategy

### Token Types

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| **Access Token** | httpOnly Cookie | 15 minutes | API authentication |
| **Refresh Token** | httpOnly Cookie | 7 days | Token rotation |

### Token Flow

```
┌──────────┐    Login     ┌──────────┐    JWT Pair    ┌──────────┐
│  Client  │─────────────▶│  NestJS  │───────────────▶│  Next.js │
│          │              │   Auth    │               │   BFF    │
│          │              │           │               │          │
│          │              │           │               │  Sets    │
│          │              │           │               │  Cookies │
│          │              │           │               │          │
└──────────┘              └───────────┘               └──────────┘
     │                                                        │
     │              Authenticated Request                     │
     │────────────────────────────────────────────────────────▶│
     │ Cookie: nexstore_access                                 │
     │                                                        │
     │◀─────────────────────────────────────────────────────────│
     │                    Response                              │
     │                                                        │
     │  If 401:                                               │
     │  POST /api/auth/refresh                                │
     │  Cookie: nexstore_refresh                              │
     │                                                        │
     │◀─────────────────────────────────────────────────────────│
     │  New access token                                      │
```

### Why Cookies Over localStorage?

| Approach | XSS Risk | CSRF | SSR Compatible |
|----------|----------|------|----------------|
| **httpOnly Cookies** | Protected | Needs CSRF token | Yes |
| localStorage | Vulnerable | N/A | No |

## Cookie Configuration

```typescript
// BFF route setting cookies
const cookieOptions = {
  httpOnly: true,      // No JavaScript access
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // CSRF protection
  path: '/',           // All paths
  maxAge: 900,         // 15 minutes (access)
  // maxAge: 604800,   // 7 days (refresh)
};

response.headers.append('Set-Cookie', serialize('nexstore_access', token, cookieOptions));
```

## RBAC (Role-Based Access Control)

### Roles

```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Full system access
  ADMIN = 'ADMIN',              // Full admin panel access
  MANAGER = 'MANAGER',          // Limited admin access
  SUPPORT = 'SUPPORT',          // Customer support
  CUSTOMER = 'CUSTOMER',        // Shop customer (default)
}
```

### Role Permissions

| Feature | SUPER_ADMIN | ADMIN | MANAGER | SUPPORT | CUSTOMER |
|---------|-------------|-------|---------|---------|------------|
| User Management | All | View/Edit | View | View | Self only |
| Product CRUD | All | All | View/Edit | View | Read |
| Order Management | All | All | All | All | Own orders |
| Inventory | All | All | View | View | — |
| Reports | All | All | Limited | — | — |

### Guard Implementation

```typescript
// Roles decorator
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {}

// Permission-based (future)
@RequirePermission('products:create')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Post('products')
async createProduct() {}
```

## Security Headers

Helmet middleware adds security headers:

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,  // Adjust for your needs
}));
```

Headers added:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production)

## Rate Limiting

Throttler protects against abuse:

```typescript
// Default: 100 requests per 15 minutes per IP
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 900,  // 15 minutes
      limit: 100,
    }),
  ],
})
```

Stricter limits for auth endpoints:

```typescript
@Throttle(10, 60)  // 10 requests per minute
@Post('login')
async login() {}
```

## Password Security

### Hashing

- Algorithm: bcrypt
- Salt rounds: 10
- Library: `bcryptjs`

```typescript
import { hash, compare } from 'bcryptjs';

// Hash password
const hashedPassword = await hash(password, 10);

// Verify password
const isValid = await compare(password, hashedPassword);
```

### Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## Input Validation

Class-validator protects against malicious input:

```typescript
export class CreateProductDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(Size, { each: true })
  sizes: Size[];
}
```

ValidationPipe (global):

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,      // Strip non-defined properties
    forbidNonWhitelisted: true,  // Throw on extra properties
    transform: true,      // Auto-transform types
  }),
);
```

## SQL Injection Prevention

Prisma ORM provides parameterized queries:

```typescript
// Safe - parameterized
const user = await prisma.user.findUnique({
  where: { email: userInput },  // Automatically parameterized
});

// Never do this
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = '${userInput}'`;
```

## Known Vulnerabilities & Mitigations

| Vulnerability | Status | Mitigation |
|--------------|--------|------------|
| XSS | Mitigated | httpOnly cookies, input validation |
| CSRF | Partial | SameSite cookies, future: CSRF tokens |
| SQL Injection | Mitigated | Prisma ORM |
| IDOR | Partial | Ownership checks in use cases |
| Brute Force | Mitigated | Rate limiting, account lockout (future) |

## Security Checklist

- [ ] Strong JWT secrets (64+ hex chars)
- [ ] HTTPS in production
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] Rate limiting enabled
- [ ] Helmet headers configured
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] No secrets in code/commits
- [ ] Regular dependency updates
- [ ] Security headers tested

## References

- [Backend Auth Module](../../backend/modules/auth.md)
- [Frontend Auth Flow](../../frontend/auth-flow.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
