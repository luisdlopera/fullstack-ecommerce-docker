import type { Collection } from '../types/collection';
import type { PaginatedResponse } from '../types';

function readNestErrorMessage(body: unknown, fallback: string): string {
	if (!body || typeof body !== 'object') return fallback;
	const msg = (body as { message?: unknown }).message;
	if (typeof msg === 'string') return msg;
	if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) return msg.join('. ');
	return fallback;
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const p = path.startsWith('/') ? path : `/${path}`;
	const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
	const headers = new Headers(options.headers);
	if (!isFormData && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	if (!headers.has('Accept')) {
		headers.set('Accept', 'application/json');
	}

	const res = await fetch(`/api/bff${p}`, {
		...options,
		credentials: 'include',
		headers,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(readNestErrorMessage(body, `Error ${res.status}`));
	}

	return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
	const sp = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val !== undefined && val !== '') sp.set(key, String(val));
	}
	const qs = sp.toString();
	return qs ? `?${qs}` : '';
}

export const collectionsApi = {
	list: (params: { page?: number; limit?: number; search?: string; gender?: string }) =>
		adminFetch<PaginatedResponse<Collection>>(`/admin/collections${buildQuery(params)}`),

	getById: (id: string) => adminFetch<Collection>(`/admin/collections/${id}`),

	create: (data: Record<string, unknown>) =>
		adminFetch<Collection>('/admin/collections', { method: 'POST', body: JSON.stringify(data) }),

	update: (id: string, data: Record<string, unknown>) =>
		adminFetch<Collection>(`/admin/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

	delete: (id: string) => adminFetch<{ ok: boolean }>(`/admin/collections/${id}`, { method: 'DELETE' }),
};
