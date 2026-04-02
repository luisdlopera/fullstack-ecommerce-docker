# Frontend Overview

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.7.x |
| Styling | Tailwind CSS | 4.x |
| Components | HeroUI | 2.6.x |
| State Management | React Context + TanStack Query | — |
| Testing | Vitest + Playwright | 3.x / 1.5x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Animations | Framer Motion | 12.x |

## Project Structure

```
front/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── [collection]/        # Dynamic collection routes
│   ├── products/[slug]/     # Product detail pages
│   ├── checkout/            # Checkout flow
│   ├── account/             # User account
│   ├── admin/               # Admin dashboard
│   └── api/                 # BFF routes
│       ├── auth/            # Auth endpoints
│       └── bff/             # API proxy
├── features/               # Domain-based features
│   ├── collection/          # Product catalog
│   ├── product-detail/    # PDP components
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout flow
│   ├── admin/               # Admin features
│   └── catalog/             # Catalog utilities
├── components/             # Shared UI components
│   ├── layout/              # Header, Footer, LayoutShell
│   └── shared/              # Reusable components
├── contexts/               # React contexts
│   ├── auth-context.tsx
│   └── favorites-context.tsx
├── lib/                    # Utilities
│   ├── api.ts               # API client
│   ├── shop-api.ts          # Shop-specific API
│   ├── bff-fetch.ts         # BFF helper
│   └── utils.ts
├── schemas/                # Zod schemas
│   └── admin/
├── hooks/                  # Custom hooks
└── test/                   # Test setup
```

## Conventions

### File Organization

- **Features**: Organized by domain (`features/collection/`, `features/cart/`)
- **Components**: Shared UI in `components/`, feature-specific in `features/*/components/`
- **Barrel Exports**: Each feature exports public API via `index.ts`

### Naming

- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase` function names
- **Hooks**: `useCamelCase`

### Server vs Client

- **Server Components** (default): Data fetching, SEO, layouts
- **Client Components**: `'use client'` for state, effects, events

```tsx
// Server Component (default)
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return <ProductDetail product={product} />;
}

// Client Component
'use client';

export function ProductDetailPageClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState('');
  // ... client logic
}
```

## Key Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 5000) |
| `npm run build` | Production build |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## Data Fetching Patterns

### 1. Server Components (RSC)

For initial data, SEO, and cached data:

```tsx
import { getFeaturedProducts, getProductBySlug } from '@/lib/api';

export default async function HomePage() {
  const products = await getFeaturedProducts();
  return <ProductGrid products={products} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return { title: product.title };
}
```

### 2. Client Fetching

For dynamic data, user interactions:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/shop-api';

export function ProductList({ initialFilters }: { initialFilters: Filters }) {
  const { data, isLoading } = useQuery({
    queryKey: ['products', initialFilters],
    queryFn: () => fetchProducts(initialFilters),
  });
  // ...
}
```

### 3. BFF Pattern

For authenticated requests with cookie handling:

```tsx
// app/api/bff/[[...path]]/route.ts
import { bffFetch } from '@/lib/bff-fetch';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const response = await bffFetch(`/api/${path}`, {
    headers: request.headers,
  });
  return response;
}
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
INTERNAL_API_URL=http://back:5001/api
```

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Browser-side API calls |
| `INTERNAL_API_URL` | Server-side API calls (Docker) |

## Imports & Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Usage:
```tsx
import { Button } from '@/components/shared/button';
import { useAuth } from '@/contexts/auth-context';
import { ProductCard } from '@/features/collection/components/product-card';
```

## Styling

### Tailwind CSS

Utility-first approach:

```tsx
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
      {children}
    </button>
  );
}
```

### HeroUI Components

Integrated component library:

```tsx
import { Button, Input, Modal } from '@heroui/react';

export function LoginForm() {
  return (
    <form>
      <Input label="Email" type="email" />
      <Input label="Password" type="password" />
      <Button color="primary">Login</Button>
    </form>
  );
}
```

## Form Handling

### React Hook Form + Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

## References

- [App Router](./app-router.md)
- [Features](./features/)
- [Auth Flow](./auth-flow.md)
- [UI System](./ui-system.md)
