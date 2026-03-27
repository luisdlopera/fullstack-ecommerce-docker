import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
	test('home loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/NEXSTORE/i);
	});
});
