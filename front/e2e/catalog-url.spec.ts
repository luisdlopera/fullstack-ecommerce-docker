import { test, expect } from '@playwright/test';

test.describe('collection URL filters', () => {
	test('preserves filter query params in the address bar', async ({ page }) => {
		await page.goto('/men?size=M&size=L&color=negro&page=2&q=jean');
		await expect(page).toHaveURL(/size=M/);
		await expect(page).toHaveURL(/color=negro/);
		await expect(page).toHaveURL(/page=2/);
		await expect(page).toHaveURL(/q=jean/);
	});
});
