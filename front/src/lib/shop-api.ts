import { getClientApiUrl, type Country, type Product } from '@/lib/api';

export async function safeParseJson<T>(res: Response, fallback: T): Promise<T> {
	if (!res.ok) return fallback;
	const text = await res.text();
	if (!text) return fallback;
	try {
		return JSON.parse(text) as T;
	} catch {
		return fallback;
	}
}

export function shopUrl(path: string): string {
	const base = getClientApiUrl().replace(/\/$/, '');
	const p = path.startsWith('/') ? path : `/${path}`;
	return `${base}${p}`;
}

export async function shopFetch(path: string, init?: RequestInit): Promise<Response> {
	return fetch(shopUrl(path), init);
}

export async function fetchProductBySlugClient(slug: string): Promise<Product | null> {
	const res = await shopFetch(`/products/${encodeURIComponent(slug)}`);
	if (!res.ok) return null;
	return (await res.json()) as Product;
}

export async function fetchCountriesClient(): Promise<Country[]> {
	const res = await shopFetch('/countries');
	return safeParseJson<Country[]>(res, []);
}
