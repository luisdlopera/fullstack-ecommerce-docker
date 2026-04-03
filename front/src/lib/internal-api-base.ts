/** Server-side Nest API base (includes `/api` prefix). */
export function getInternalApiBase(): string {
	// Priority: INTERNAL_API_URL > NEXT_PUBLIC_API_URL > constructed from env vars
	const raw = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? buildFallbackApiUrl();
	return raw.replace(/\/$/, '');
}

function buildFallbackApiUrl(): string {
	// Construct URL from environment variables
	const port = process.env.BACKEND_PORT || process.env.BACK_PORT || '5007';
	const host = process.env.BACKEND_HOST || 'localhost';
	return `http://${host}:${port}/api`;
}
