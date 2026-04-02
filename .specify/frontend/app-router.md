# App Router Structure

## Next.js App Router (Next.js 16)

Nexstore uses the Next.js App Router with a clear separation between routes and features.

## Route Structure

```
app/
├── layout.tsx              # Root layout (AuthProvider, global UI)
├── page.tsx                # Homepage
├── loading.tsx             # Global loading state
├── error.tsx               # Global error boundary
├── not-found.tsx           # 404 page
│
├── [collection]/           # Dynamic collection routes
│   └── page.tsx            # Collection listing
│
├── products/
│   └── [slug]/
│       ├── page.tsx        # Product detail (Server Component)
│       └── loading.tsx     # PDP loading state
│
├── checkout/
│   ├── layout.tsx          # Checkout layout (no header/footer)
│   └── page.tsx            # Checkout form
│
├── account/
│   └── page.tsx            # User account dashboard
│
├── admin/
│   ├── layout.tsx          # Admin layout
│   ├── page.tsx            # Admin dashboard
│   ├── products/
│   │   └── page.tsx        # Product management
│   ├── orders/
│   │   └── page.tsx        # Order management
│   └── inventory/
│       └── page.tsx        # Inventory management
│
└── api/                    # Backend-for-Frontend (BFF)
    ├── auth/
    │   ├── login/route.ts       # POST /api/auth/login
    │   ├── register/route.ts    # POST /api/auth/register
    │   ├── refresh/route.ts     # POST /api/auth/refresh
    │   ├── logout/route.ts      # POST /api/auth/logout
    │   └── session/route.ts     # GET /api/auth/session
    │
    └── bff/
        └── [[...path]]/route.ts  # Proxy to NestJS API
```

## Layout Hierarchy

### Root Layout

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <FavoritesProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### LayoutShell

Controls header/footer visibility based on route:

```tsx
// components/layout/layout-shell.tsx
'use client';

import { usePathname } from 'next/navigation';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isCheckout = pathname.startsWith('/checkout');
  const hideLayout = isAdmin || isCheckout;

  return (
    <>
      {!hideLayout && <Header />}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
```

### Admin Layout

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
```

## Route Patterns

### Dynamic Routes

```tsx
// app/[collection]/page.tsx
export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { collection: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = parseFilters(searchParams);
  const products = await getProducts(params.collection, filters);
  
  return (
    <CollectionView 
      collection={params.collection} 
      products={products}
      filters={filters}
    />
  );
}
```

### Static Routes with Data

```tsx
// app/page.tsx (Homepage)
export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  
  return (
    <>
      <HeroSection />
      <FeaturedProducts products={featuredProducts} />
      <CategoryGrid />
    </>
  );
}
```

### Nested Dynamic Routes

```tsx
// app/products/[slug]/page.tsx
export default async function ProductPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    notFound();
  }
  
  return (
    <>
      <ProductDetailServer product={product} />
      <ProductDetailPageClient product={product} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return {
    title: product?.title,
    description: product?.description,
  };
}
```

## BFF (Backend-for-Frontend) Routes

### Auth Proxy

```tsx
// app/api/auth/login/route.ts
import { bffFetch } from '@/lib/bff-fetch';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Forward to NestJS
  const response = await bffFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  // Set cookies
  const headers = new Headers();
  headers.append('Set-Cookie', `nexstore_access=${data.accessToken}; HttpOnly; Secure; SameSite=Strict`);
  headers.append('Set-Cookie', `nexstore_refresh=${data.refreshToken}; HttpOnly; Secure; SameSite=Strict`);
  
  return Response.json(
    { user: data.user },
    { headers }
  );
}
```

### Generic API Proxy

```tsx
// app/api/bff/[[...path]]/route.ts
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:5001/api';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  
  const response = await fetch(`${INTERNAL_API_URL}/${path}${url.search}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    },
  });
  
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

## Loading & Error States

### Loading UI

```tsx
// app/products/[slug]/loading.tsx
export default function ProductLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-200 rounded" />
      <div className="h-8 bg-gray-200 rounded mt-4 w-1/2" />
    </div>
  );
}
```

### Error Handling

```tsx
// app/products/[slug]/error.tsx
'use client';

export default function ProductError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-bold">Error loading product</h2>
      <p className="text-gray-600">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-primary text-white rounded">
        Try again
      </button>
    </div>
  );
}
```

## Parallel Routes (Future)

Structure for modal patterns:

```
app/
├── @modal/                 # Parallel route for modals
│   └── (.)products/[slug]/ # Intercepted product route
├── layout.tsx              # Includes {children} and {modal}
└── products/
    └── [slug]/
        └── page.tsx        # Full page version
```

## Route Groups (Future)

For organizing without URL segments:

```
app/
├── (marketing)/            # Group: no URL prefix
│   ├── page.tsx            # /
│   ├── about/page.tsx      # /about
│   └── contact/page.tsx    # /contact
└── (shop)/                 # Group: no URL prefix
    ├── products/
    └── cart/
```

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Data Fetching Patterns](./state-management.md)
- [Auth Flow](./auth-flow.md)
