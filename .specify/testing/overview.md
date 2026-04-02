# Testing Overview

## Testing Strategy

Nexstore employs a multi-layered testing approach covering unit, integration, and end-to-end testing.

## Test Pyramid

```
        /\
       /  \
      / E2E \     <- Playwright (Critical flows)
     /─────────\
    /            \
   /  Integration  \  <- API tests, DB integration
  /──────────────────\
 /                      \
/       Unit Tests       \ <- Jest (Backend), Vitest (Frontend)
───────────────────────────
```

## Backend Testing

### Framework: Jest

Configuration: `back/jest.config.ts`

**Test Commands**:
```bash
cd back
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage
```

### Unit Tests

Mock repositories and test business logic:

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: MockAuthRepository;

  beforeEach(() => {
    mockRepo = new MockAuthRepository();
    service = new AuthService(mockRepo);
  });

  it('should return tokens on valid login', async () => {
    // Arrange
    const credentials = { email: 'test@test.com', password: 'password' };
    mockRepo.findByEmail.mockResolvedValue(mockUser);

    // Act
    const result = await service.login(credentials);

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
```

### Integration Tests

Test with real database (test container):

```typescript
// prisma-product.repository.spec.ts
describe('PrismaProductRepository', () => {
  let repository: PrismaProductRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test database
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
    
    prisma = module.get<PrismaService>(PrismaService);
    repository = new PrismaProductRepository(prisma);
  });

  afterEach(async () => {
    await prisma.product.deleteMany();
  });

  it('should find product by slug', async () => {
    const product = await prisma.product.create({
      data: { title: 'Test', slug: 'test', /* ... */ },
    });

    const result = await repository.findBySlug('test');
    
    expect(result).toMatchObject({ id: product.id, slug: 'test' });
  });
});
```

### What NOT to Test

- Controller methods that only delegate
- DTO getters without logic
- Prisma-generated code
- Third-party library internals

## Frontend Testing

### Unit Tests: Vitest

Configuration: `front/vitest.config.ts`

**Test Commands**:
```bash
cd front
npm test              # Run tests
npm run test:watch    # Watch mode
```

### Component Testing

```tsx
// product-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from './product-card';

describe('ProductCard', () => {
  it('renders product information', () => {
    const product = {
      id: '1',
      title: 'Test Product',
      price: 100,
      images: [{ url: '/test.jpg' }],
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});
```

### Hook Testing

```tsx
// use-cart.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCart } from './use-cart';

describe('useCart', () => {
  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: '1', quantity: 2 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(2);
  });
});
```

## E2E Testing

### Framework: Playwright

Configuration: `front/playwright.config.mjs`

**Test Commands**:
```bash
cd front
npm run test:e2e              # Run E2E tests
npm run test:e2e:auth:real    # With real auth
```

### Configuration

```javascript
// playwright.config.mjs
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    timeout: 120_000,
  },
});
```

### Critical Flows

```typescript
// e2e/checkout.spec.ts
test('customer can complete purchase', async ({ page }) => {
  // Arrange
  await page.goto('/products/test-product');
  
  // Act
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout-button"]');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="address"]', '123 Test St');
  await page.click('[type="submit"]');
  
  // Assert
  await expect(page).toHaveURL(/\/checkout\/success/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

### Test Ports

E2E tests use isolated ports to avoid conflicts:

| Service | Default | Test |
|---------|---------|------|
| Frontend | 5000 | 5100 |
| Backend | 5001 | 5101 |

## Test Data

### Seed Data

```bash
# Seed test database
npm run prisma:seed -w back
```

Test accounts:
- `admin@nexstore.com` / `Qwert.12345`
- `cliente@nexstore.com` / `Qwert.12345`

### Fixtures

```typescript
// e2e/fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@nexstore.com',
    password: 'Qwert.12345',
  },
  customer: {
    email: 'cliente@nexstore.com',
    password: 'Qwert.12345',
  },
};
```

## Coverage Goals

| Layer | Target Coverage |
|-------|----------------|
| Business Logic | 80%+ |
| Use Cases | 70%+ |
| Controllers | 50%+ (delegation only) |
| E2E Critical Flows | 100% |

## CI Integration

Tests run on every PR:

```yaml
# .github/workflows/ci.yml
- name: Backend Tests
  run: npm run test -w back -- --coverage

- name: Frontend Unit Tests  
  run: npm run test -w front

- name: E2E Tests
  run: npm run test:e2e -w front
```

## Best Practices

1. **Test behavior, not implementation**
2. **One assertion per test** (ideally)
3. **Use descriptive test names**
4. **Clean up after tests** (database, storage)
5. **Mock external services** (payments, email)
6. **Test both success and error cases**

## References

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
