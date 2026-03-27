import { test, expect } from '@playwright/test';

test.describe('auth page', () => {
	test('login form is visible', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByRole('textbox', { name: 'Correo' }).first()).toBeVisible();
	});
});
