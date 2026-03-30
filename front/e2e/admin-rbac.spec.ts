import { expect, test } from '@playwright/test';

type LoginResponse = { accessToken: string; refreshToken: string };

const frontPort = Number(process.env.E2E_FRONT_PORT ?? 3100);
const backPort = Number(process.env.E2E_BACK_PORT ?? 4100);
const frontOrigin = `http://localhost:${frontPort}`;
const backApi = `http://localhost:${backPort}/api`;

async function authenticate(page: Parameters<typeof test>[1]['page'], email: string, password = 'Qwert.12345') {
  const loginRes = await page.request.post(`${backApi}/auth/login`, {
    data: { email, password },
  });

  expect(loginRes.ok()).toBeTruthy();

  const auth = (await loginRes.json()) as LoginResponse;
  await page.context().addCookies([
    {
      name: 'nexstore_access',
      value: auth.accessToken,
      url: frontOrigin,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'nexstore_refresh',
      value: auth.refreshToken,
      url: frontOrigin,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.describe('admin RBAC route protection', () => {
  test.beforeEach(() => {
    test.skip(!process.env.E2E_AUTH_REAL, 'Requires E2E_AUTH_REAL with backend + frontend running.');
  });

  test('unauthenticated user is redirected to auth on /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\?next=%2Fadmin$/);
  });

  test('customer is blocked from /admin', async ({ page }) => {
    await authenticate(page, 'cliente@nexstore.com');

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByRole('heading', { name: 'No tienes acceso a este recurso' })).toBeVisible();
  });

  test('manager can enter dashboard but cannot open users/payments', async ({ page }) => {
    await authenticate(page, 'manager@nexstore.com');

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/forbidden$/);

    await page.goto('/admin/payments');
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('support can access orders but not payments/settings', async ({ page }) => {
    await authenticate(page, 'support@nexstore.com');

    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible();

    await page.goto('/admin/payments');
    await expect(page).toHaveURL(/\/forbidden$/);

    await page.goto('/admin/countries');
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('super admin can access audit logs and settings area', async ({ page }) => {
    await authenticate(page, 'superadmin@nexstore.com');

    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL(/\/admin\/audit-logs$/);
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();

    await page.goto('/admin/countries');
    await expect(page).toHaveURL(/\/admin\/countries$/);
    await expect(page.getByRole('heading', { name: 'Países' })).toBeVisible();
  });
});
