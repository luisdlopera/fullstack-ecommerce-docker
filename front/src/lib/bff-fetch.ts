/**
 * Authenticated calls via Next.js BFF (JWT in httpOnly cookies).
 * Public catalog continues to use {@link getClientApiUrl} + direct fetch.
 */
export function bffFetch(path: string, init?: RequestInit): Promise<Response> {
	const p = path.startsWith('/') ? path : `/${path}`;
	return fetch(`/api/bff${p}`, {
		...init,
		credentials: 'include',
	});
}
