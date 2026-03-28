import { expect, test } from '@playwright/test';

test.describe('account authenticated flows', () => {
	test('logs in and navigates account sidebar sections', async ({ page }) => {
		test.skip(
			!process.env.E2E_AUTH_REAL,
			'Requires full auth flow environment with backend-compatible session handling.',
		);

		const frontPort = Number(process.env.E2E_FRONT_PORT ?? 3100);
		const backPort = Number(process.env.E2E_BACK_PORT ?? 4100);
		const frontOrigin = `http://localhost:${frontPort}`;

		const loginRes = await page.request.post(`http://localhost:${backPort}/api/auth/login`, {
			data: {
				email: 'admin@nexstore.com',
				password: 'Qwert.12345',
			},
		});
		expect(loginRes.ok()).toBeTruthy();
		const auth = (await loginRes.json()) as { accessToken: string; refreshToken: string };

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

		const sessionRes = await page.request.get(`${frontOrigin}/api/auth/session`, {
			headers: {
				cookie: `nexstore_access=${auth.accessToken}; nexstore_refresh=${auth.refreshToken}`,
			},
		});
		expect(sessionRes.ok()).toBeTruthy();

		await page.goto('/account/profile');

		await expect(page.getByRole('heading', { name: 'Editar datos del usuario' })).toBeVisible();
		await expect(page.getByText('Administrador')).toBeVisible();

		await page.getByRole('link', { name: 'Direcciones' }).click();
		await expect(page.getByRole('heading', { name: 'Administrar direcciones' })).toBeVisible();

		await page.getByRole('link', { name: 'Historial favoritos' }).click();
		await expect(page.getByRole('heading', { name: 'Historial de favoritos' })).toBeVisible();

		await page.getByRole('link', { name: 'Configuración' }).click();
		await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
		await page.getByLabel(/^Contraseña actual\*?$/).fill('Current.123');
		await page.getByLabel(/^Nueva contraseña\*?$/).fill('NewPass.456');
		await page.getByLabel(/^Confirmar nueva contraseña\*?$/).fill('NoMatch.456');
		await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
		await expect(page.getByText('La confirmación no coincide con la nueva contraseña.')).toBeVisible();

		await page.getByRole('link', { name: 'Mis pedidos' }).click();
		await expect(page.getByRole('heading', { name: 'Mis Pedidos' })).toBeVisible();
	});
});
