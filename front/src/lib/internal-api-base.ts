/** Server-side Nest API base (includes `/api` prefix). */
export function getInternalApiBase(): string {
	const raw = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';
	return raw.replace(/\/$/, '');
}
