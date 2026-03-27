import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const frontRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		...devices['Desktop Chrome'],
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npm run dev',
		cwd: frontRoot,
		url: 'http://127.0.0.1:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
