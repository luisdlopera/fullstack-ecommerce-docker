# Frontend Auth Flow

## Overview

Frontend authentication uses a Backend-for-Frontend (BFF) pattern with httpOnly cookies for secure token storage.

## Architecture

```
┌──────────┐    Login/Register     ┌──────────┐    Forward    ┌──────────┐
│  Browser │─────────────────────▶│ Next.js  │─────────────▶│  NestJS  │
│          │                      │  BFF     │             │   API    │
│          │◀─────────────────────│          │◀────────────│          │
└──────────┘   Set httpOnly        └──────────┘   JWT Pair   └──────────┘
             Cookies (access
             + refresh)
                  │
                  │  Authenticated
                  │  Requests
                  ▼
            ┌──────────┐
            │  Cookie  │────▶ BFF validates
            │  Auto-   │      cookie, proxies
            │  sent    │      to API
            └──────────┘
```

## Why Cookies over localStorage?

| Approach | Security | XSS Protection | CSRF | Implementation |
|----------|----------|----------------|------|----------------|
| **httpOnly Cookies** | High | Protected | Needs CSRF token | More complex |
| localStorage | Low | Vulnerable | N/A | Simple |

**Cookies are used because:**
- JavaScript cannot access tokens (XSS protection)
- Automatic browser handling
- Works with SSR/Server Components
- Aligns with security best practices

## BFF Routes

### Auth API Routes

```
app/api/auth/
├── login/route.ts       # POST - Authenticate, set cookies
├── register/route.ts    # POST - Create account, set cookies
├── logout/route.ts      # POST - Clear cookies
├── refresh/route.ts     # POST - Refresh token rotation
└── session/route.ts     # GET - Get current session
```

### Implementation

```tsx
// app/api/auth/login/route.ts
import { bffFetch } from '@/lib/bff-fetch';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Forward to NestJS
  const response = await fetch(`${INTERNAL_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    return new Response(await response.text(), { status: response.status });
  }
  
  const { user, accessToken, refreshToken } = await response.json();
  
  // Set httpOnly cookies
  const headers = new Headers();
  headers.append('Set-Cookie', `nexstore_access=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`);  // 15 min
  headers.append('Set-Cookie', `nexstore_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);  // 7 days
  
  return Response.json({ user }, { headers });
}
```

## AuthContext

Centralized auth state management:

```tsx
// contexts/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user } = await response.json();
    setUser(user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## bffFetch Helper

Authenticated requests to backend:

```tsx
// lib/bff-fetch.ts
export async function bffFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${INTERNAL_API_URL}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',  // Send cookies
  });

  // Handle 401 - try to refresh
  if (response.status === 401) {
    const refreshed = await fetch('/api/auth/refresh', { method: 'POST' });
    
    if (refreshed.ok) {
      // Retry original request
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });
    }
    
    // Refresh failed - logout
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return response;
}
```

## Protected Routes

### Client-Side Protection

```tsx
// components/auth/protected-route.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { redirect } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    redirect('/login?redirect=' + encodeURIComponent(window.location.pathname));
  }

  return <>{children}</>;
}
```

### Admin Protection

```tsx
// components/auth/admin-route.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Role } from '@nexstore/api-types';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role === Role.CUSTOMER) {
    redirect('/');
  }

  return <>{children}</>;
}
```

## Login Page Implementation

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    
    try {
      await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      router.push(redirect);
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

## Token Lifecycle

```
┌─────────┐    Login/Register    ┌─────────┐
│  User   │─────────────────────▶│  API    │
└─────────┘                      └────┬────┘
                                      │
                                      ▼ Sets cookies
                              ┌───────────────┐
                              │ nexstore_access│ (15 min)
                              │ nexstore_refresh│ (7 days)
                              └───────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
       API Request            Token Expired          Logout
              │                       │                       │
              │ Cookie sent           │ 401 response            │
              │                       │                       │
              ▼                       ▼                       ▼
       Request succeeds     Call /api/auth/refresh   Clear cookies
                                 │                       │
                                 ▼                       ▼
                         New token pair            Redirect to /
                         (rotation)
```

## Testing Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexstore.com | Qwert.12345 |
| Customer | cliente@nexstore.com | Qwert.12345 |

## References

- [Backend Auth Module](../../backend/modules/auth.md)
- [Security - Auth Flow](../../security/auth-flow.md)
