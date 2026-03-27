import { getClientApiUrl } from '@/lib/api';
import type {
	AdminCategory,
	AdminCountry,
	AdminOrder,
	AdminProduct,
	AdminUser,
	DashboardSummary,
	PaginatedResponse,
	SalesChartPoint,
	TopProduct,
} from '../types';

function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('nexstore-token');
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const baseUrl = getClientApiUrl();
	const token = getToken();

	const res = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({ message: 'Request failed' }));
		throw new Error((body as { message?: string }).message ?? `Error ${res.status}`);
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

// ─── Dashboard ───────────────────────────────────────────────────────

export const dashboardApi = {
	getSummary: (period?: string) => adminFetch<DashboardSummary>(`/admin/dashboard/summary${buildQuery({ period })}`),

	getSalesChart: (period?: string) =>
		adminFetch<SalesChartPoint[]>(`/admin/dashboard/sales-chart${buildQuery({ period })}`),

	getRecentOrders: (limit?: number) =>
		adminFetch<AdminOrder[]>(`/admin/dashboard/recent-orders${buildQuery({ limit })}`),

	getTopProducts: (limit?: number) =>
		adminFetch<TopProduct[]>(`/admin/dashboard/top-products${buildQuery({ limit })}`),
};

// ─── Users ───────────────────────────────────────────────────────────

export const usersApi = {
	list: (params: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
		adminFetch<PaginatedResponse<AdminUser>>(`/admin/users${buildQuery(params)}`),

	getById: (id: string) => adminFetch<AdminUser>(`/admin/users/${id}`),

	create: (data: Record<string, unknown>) =>
		adminFetch<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

	update: (id: string, data: Record<string, unknown>) =>
		adminFetch<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

	updateRole: (id: string, role: string) =>
		adminFetch<AdminUser>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

	updateStatus: (id: string, isActive: boolean) =>
		adminFetch<AdminUser>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

	delete: (id: string) => adminFetch<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
};

// ─── Orders ──────────────────────────────────────────────────────────

export const ordersApi = {
	list: (params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: string;
		paymentStatus?: string;
		paid?: boolean;
	}) => adminFetch<PaginatedResponse<AdminOrder>>(`/admin/orders${buildQuery(params)}`),

	getById: (id: string) => adminFetch<AdminOrder>(`/admin/orders/${id}`),

	updateStatus: (id: string, status: string) =>
		adminFetch<AdminOrder>(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

	updatePaymentStatus: (id: string, paymentStatus: string) =>
		adminFetch<AdminOrder>(`/admin/orders/${id}/payment-status`, {
			method: 'PATCH',
			body: JSON.stringify({ paymentStatus }),
		}),

	updateNotes: (id: string, internalNotes: string) =>
		adminFetch<AdminOrder>(`/admin/orders/${id}/notes`, {
			method: 'PATCH',
			body: JSON.stringify({ internalNotes }),
		}),
};

// ─── Products ────────────────────────────────────────────────────────

export const productsApi = {
	list: (params: {
		page?: number;
		limit?: number;
		search?: string;
		categoryId?: string;
		isActive?: boolean;
		inStock?: boolean;
	}) => adminFetch<PaginatedResponse<AdminProduct>>(`/admin/products${buildQuery(params)}`),

	getById: (id: string) => adminFetch<AdminProduct>(`/admin/products/${id}`),

	create: (data: Record<string, unknown>) =>
		adminFetch<AdminProduct>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),

	update: (id: string, data: Record<string, unknown>) =>
		adminFetch<AdminProduct>(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

	delete: (id: string) => adminFetch<{ ok: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),

	updateStatus: (id: string, isActive: boolean) =>
		adminFetch<AdminProduct>(`/admin/products/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ isActive }),
		}),

	addImage: (id: string, imageUrl: string) =>
		adminFetch<{ id: number; url: string }>(`/admin/products/${id}/images`, {
			method: 'POST',
			body: JSON.stringify({ imageUrl }),
		}),

	deleteImage: (productId: string, imageId: number) =>
		adminFetch<{ ok: boolean }>(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
};

// ─── Categories ──────────────────────────────────────────────────────

export const categoriesApi = {
	list: () => adminFetch<AdminCategory[]>('/admin/categories'),

	getById: (id: string) => adminFetch<AdminCategory>(`/admin/categories/${id}`),

	create: (data: Record<string, unknown>) =>
		adminFetch<AdminCategory>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),

	update: (id: string, data: Record<string, unknown>) =>
		adminFetch<AdminCategory>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

	delete: (id: string) => adminFetch<{ ok: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),
};

// ─── Countries ───────────────────────────────────────────────────────

export const countriesApi = {
	list: () => adminFetch<AdminCountry[]>('/admin/countries'),

	create: (data: Record<string, unknown>) =>
		adminFetch<AdminCountry>('/admin/countries', { method: 'POST', body: JSON.stringify(data) }),

	update: (id: string, data: Record<string, unknown>) =>
		adminFetch<AdminCountry>(`/admin/countries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

	delete: (id: string) => adminFetch<{ ok: boolean }>(`/admin/countries/${id}`, { method: 'DELETE' }),
};
