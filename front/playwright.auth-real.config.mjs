import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const frontRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontRoot, '..');
const frontPort = Number(process.env.E2E_FRONT_PORT ?? 3100);
const backPort = Number(process.env.E2E_BACK_PORT ?? 4100);
const frontBaseUrl = `http://localhost:${frontPort}`;
const backBaseUrl = `http://localhost:${backPort}/api`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		...devices['Desktop Chrome'],
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? frontBaseUrl,
		trace: 'on-first-retry',
	},
	webServer: [
		{
			command: `npm run dev:db && npm run db:sync:seed && PORT=${backPort} CORS_ORIGIN=${frontBaseUrl} npm run start:dev -w back`,
			cwd: repoRoot,
			url: `${backBaseUrl}/health`,
			reuseExistingServer: false,
			timeout: 240_000,
		},
		{
			command: `npm run dev -w front -- --port ${frontPort}`,
			cwd: repoRoot,
			env: {
				...process.env,
				NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? backBaseUrl,
				INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? backBaseUrl,
			},
			url: frontBaseUrl,
			reuseExistingServer: false,
			timeout: 180_000,
		},
	],
});
