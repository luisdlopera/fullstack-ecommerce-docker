# User Login Flow

## Overview

Authentication flow using JWT tokens stored in httpOnly cookies.

## Flow Diagram

```
┌──────────┐                              ┌──────────┐                              ┌──────────┐
│  Browser │                              │ Next.js  │                              │  NestJS  │
│          │                              │   BFF    │                              │   API    │
└────┬─────┘                              └────┬─────┘                              └────┬─────┘
     │                                         │                                         │
     │  1. Enter credentials                   │                                         │
     │  2. Click Login                         │                                         │
     │────────────────────────────────────────▶│                                         │
     │                                         │                                         │
     │                                         │  3. POST /api/auth/login                │
     │                                         │     { email, password }                 │
     │                                         │────────────────────────────────────────▶│
     │                                         │                                         │
     │                                         │                                         │  4. Validate
     │                                         │                                         │     credentials
     │                                         │                                         │
     │                                         │                                         │  5. Generate
     │                                         │                                         │     JWT pair
     │                                         │                                         │
     │                                         │  6. Return tokens + user                │
     │                                         │◀────────────────────────────────────────│
     │                                         │                                         │
     │  7. Set httpOnly cookies                │                                         │
     │     - nexstore_access (15 min)         │                                         │
     │     - nexstore_refresh (7 days)        │                                         │
     │◀────────────────────────────────────────│                                         │
     │                                         │                                         │
     │  8. Return user (no tokens)            │                                         │
     │◀────────────────────────────────────────│                                         │
     │                                         │                                         │
     │  9. Update AuthContext                  │                                         │
     │  10. Redirect to account/dashboard      │                                         │
     │                                         │                                         │
```

## Step-by-Step

### 1. User Initiates Login

User enters credentials on login page (`/login`).

```tsx
// app/login/page.tsx
export default function LoginPage() {
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await login(
      formData.get('email') as string,
      formData.get('password') as string
    );
    // Redirect handled by AuthContext
  };
}
```

### 2. Frontend Calls BFF

```typescript
// contexts/auth-context.tsx
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error('Login failed');
  
  const { user } = await response.json();
  setUser(user);  // Cookies set automatically by browser
  router.push('/account');
};
```

### 3. BFF Forwards to API

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const response = await fetch(`${INTERNAL_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const { user, accessToken, refreshToken } = await response.json();
  
  // Set cookies
  const headers = new Headers();
  headers.append('Set-Cookie', `nexstore_access=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`);
  headers.append('Set-Cookie', `nexstore_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
  
  return Response.json({ user }, { headers });
}
```

### 4. API Validates & Generates Tokens

```typescript
// modules/auth/application/use-cases/login.use-case.ts
async execute(dto: LoginDto): Promise<AuthResponse> {
  // Find user
  const user = await this.userRepo.findByEmail(dto.email);
  if (!user) throw new UnauthorizedException();
  
  // Validate password
  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new UnauthorizedException();
  
  // Generate tokens
  const accessToken = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  }, { expiresIn: '15m' });
  
  const refreshToken = this.jwtService.sign({
    sub: user.id,
    jti: uuid(),
    familyId: uuid(),
  }, { expiresIn: '7d' });
  
  // Store refresh token hash
  await this.refreshTokenRepo.create({
    userId: user.id,
    tokenHash: await bcrypt.hash(refreshToken, 10),
    jti: payload.jti,
    familyId: payload.familyId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  return { user, accessToken, refreshToken };
}
```

### 5. Subsequent Requests

Cookies are automatically sent with each request:

```typescript
// lib/bff-fetch.ts
export async function bffFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',  // Send cookies
  });
  
  // Handle 401 - try refresh
  if (response.status === 401) {
    const refreshed = await fetch('/api/auth/refresh', { 
      method: 'POST',
      credentials: 'include',
    });
    
    if (refreshed.ok) {
      // Retry original request
      return fetch(url, { ...options, credentials: 'include' });
    }
    
    // Refresh failed - logout
    window.location.href = '/login';
  }
  
  return response;
}
```

### 6. Token Refresh

When access token expires, refresh token is used:

```typescript
// app/api/auth/refresh/route.ts
export async function POST(request: Request) {
  const refreshToken = request.cookies.get('nexstore_refresh')?.value;
  
  // Verify refresh token
  const payload = jwt.verify(refreshToken, JWT_SECRET);
  const stored = await refreshTokenRepo.findByJti(payload.jti);
  
  if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
    throw new UnauthorizedException();
  }
  
  // Rotate: create new token pair
  const newAccessToken = jwt.sign({ sub: payload.sub }, JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ 
    sub: payload.sub, 
    jti: uuid(),
    familyId: stored.familyId,
  }, JWT_SECRET, { expiresIn: '7d' });
  
  // Revoke old, store new
  await refreshTokenRepo.revoke(payload.jti);
  await refreshTokenRepo.create({
    userId: payload.sub,
    tokenHash: await bcrypt.hash(newRefreshToken, 10),
    jti: newJti,
    familyId: stored.familyId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  // Set new cookies
  const headers = new Headers();
  headers.append('Set-Cookie', `nexstore_access=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`);
  headers.append('Set-Cookie', `nexstore_refresh=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
  
  return Response.json({ success: true }, { headers });
}
```

### 7. Logout

```typescript
// app/api/auth/logout/route.ts
export async function POST(request: Request) {
  const refreshToken = request.cookies.get('nexstore_refresh')?.value;
  
  if (refreshToken) {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    // Revoke entire token family
    await refreshTokenRepo.revokeFamily(payload.familyId);
  }
  
  // Clear cookies
  const headers = new Headers();
  headers.append('Set-Cookie', 'nexstore_access=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  headers.append('Set-Cookie', 'nexstore_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  
  return Response.json({ success: true }, { headers });
}
```

## Cookie Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | `true` | Prevent JavaScript access (XSS protection) |
| `Secure` | `true` | HTTPS only (production) |
| `SameSite` | `Strict` | CSRF protection |
| `Path` | `/` | Available on all routes |
| `Max-Age` | 900 / 604800 | 15 min / 7 days |

## Error Handling

| Error | Response | Action |
|-------|----------|--------|
| Invalid credentials | 401 | Show error message |
| Account disabled | 403 | Contact support message |
| Token expired | 401 | Auto-refresh (silent) |
| Refresh expired | 401 | Redirect to login |

## References

- [Backend Auth Module](../../backend/modules/auth.md)
- [Frontend Auth Flow](../../frontend/auth-flow.md)
- [Security Overview](../../security/overview.md)
