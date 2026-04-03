import { defineConfig, devices } from '@playwright/test';

const frontPort = Number(process.env.FRONTEND_PORT || process.env.FRONT_PORT || 5006);
const frontBaseUrl = `http://localhost:${frontPort}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		...devices['Desktop Chrome'],
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? frontBaseUrl,
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npm run dev',
		url: frontBaseUrl,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
