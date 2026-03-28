import { expect, test } from '@playwright/test';

test.describe('account sidebar flows', () => {
	test('loads account profile route and shows unauthenticated header state', async ({ page }) => {
		await page.goto('/account/profile');
		await expect(page).toHaveURL(/\/account\/profile$/);
		await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
	});
});
