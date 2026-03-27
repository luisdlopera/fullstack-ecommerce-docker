export type {
	ProductImage,
	Category,
	Product,
	ProductListResponse,
	ProductFacets,
	ProductFilters,
	Country,
} from '@nexstore/api-types';

export type FeaturedProduct = {
	id: string;
	title: string;
	price: number;
	slug: string;
	images?: string[];
	/** From API; used for home tabs. */
	gender?: string;
	tags?: string[];
};

import type { Product, ProductImage, ProductListResponse, ProductFacets, ProductFilters, Category, Country } from '@nexstore/api-types';

const getBaseApiUrl = () => {
	if (typeof window === 'undefined') {
		return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
	}

	return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
};

export function getClientApiUrl() {
	return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

type FeaturedApiRow = {
	id: string;
	title: string;
	price: number;
	slug: string;
	gender?: string;
	tags?: string[];
	ProductImage?: ProductImage[];
};

export async function getFeaturedProducts(limit = 8): Promise<FeaturedProduct[]> {
	const baseUrl = getBaseApiUrl();
	const response = await fetch(`${baseUrl}/products/featured?limit=${limit}`, {
		next: { revalidate: 60 },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch products: ${response.status}`);
	}

	const rows = (await response.json()) as FeaturedApiRow[];
	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		price: row.price,
		slug: row.slug,
		gender: row.gender,
		tags: row.tags,
		images: row.ProductImage?.map((img) => img.url) ?? [],
	}));
}

export async function getProductBySlug(slug: string): Promise<Product> {
	const baseUrl = getBaseApiUrl();
	const response = await fetch(`${baseUrl}/products/${encodeURIComponent(slug)}`, {
		next: { revalidate: 60 },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch product: ${response.status}`);
	}

	return response.json() as Promise<Product>;
}

export async function getProductBySlugOrNull(slug: string): Promise<Product | null> {
	const baseUrl = getBaseApiUrl();
	const response = await fetch(`${baseUrl}/products/${encodeURIComponent(slug)}`, {
		next: { revalidate: 60 },
	});

	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Failed to fetch product: ${response.status}`);
	}

	return response.json() as Promise<Product>;
}

export function appendProductFiltersToSearchParams(params: URLSearchParams, filters: ProductFilters): void {
	if (filters.page) params.set('page', String(filters.page));
	if (filters.limit) params.set('limit', String(filters.limit));
	if (filters.query) params.set('query', filters.query);
	if (filters.category) params.set('category', filters.category);
	if (filters.tag) params.set('tag', filters.tag);
	if (filters.mustTag) params.set('mustTag', filters.mustTag);
	if (filters.anyTags?.length) params.set('anyTags', filters.anyTags.join(','));
	if (filters.gender) params.set('gender', filters.gender);
	if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
	if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
	if (filters.avail === 'in') params.set('avail', 'in');
	else if (filters.avail === 'out') params.set('avail', 'out');
	else if (filters.inStock !== undefined) params.set('inStock', String(filters.inStock));
	if (filters.sizes?.length) params.set('sizes', filters.sizes.join(','));
	if (filters.colors?.length) params.set('colors', filters.colors.join(','));
	if (filters.categories?.length) params.set('categories', filters.categories.join(','));
	if (filters.colSlugs?.length) params.set('colSlugs', filters.colSlugs.join(','));
	if (filters.classifications?.length) params.set('classifications', filters.classifications.join(','));
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
	const baseUrl = getBaseApiUrl();
	const params = new URLSearchParams();
	appendProductFiltersToSearchParams(params, filters);

	const qs = params.toString();
	const response = await fetch(`${baseUrl}/products${qs ? `?${qs}` : ''}`, {
		next: { revalidate: 60 },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch products: ${response.status}`);
	}

	return response.json() as Promise<ProductListResponse>;
}

/** Client-side product list (same query shape as getProducts). */
export async function fetchProductsClient(filters: ProductFilters = {}): Promise<ProductListResponse> {
	const baseUrl = getClientApiUrl();
	const params = new URLSearchParams();
	appendProductFiltersToSearchParams(params, filters);
	const qs = params.toString();
	const response = await fetch(`${baseUrl}/products${qs ? `?${qs}` : ''}`, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(`Failed to fetch products: ${response.status}`);
	}

	return response.json() as Promise<ProductListResponse>;
}

/** Facet counts for PLP sidebar (same filter semantics as list, no extra product page fetch). */
export async function fetchProductFacetsClient(filters: ProductFilters = {}): Promise<ProductFacets> {
	const baseUrl = getClientApiUrl();
	const params = new URLSearchParams();
	const { page: _p, limit: _l, ...rest } = filters;
	appendProductFiltersToSearchParams(params, rest);
	const qs = params.toString();
	const response = await fetch(`${baseUrl}/products/facets${qs ? `?${qs}` : ''}`, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(`Failed to fetch product facets: ${response.status}`);
	}

	return response.json() as Promise<ProductFacets>;
}

export async function getCategories(): Promise<Category[]> {
	const baseUrl = getBaseApiUrl();
	const response = await fetch(`${baseUrl}/categories`, {
		next: { revalidate: 300 },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch categories: ${response.status}`);
	}

	return response.json() as Promise<Category[]>;
}

export async function getCountries(): Promise<Country[]> {
	const baseUrl = getBaseApiUrl();
	const response = await fetch(`${baseUrl}/countries`, {
		next: { revalidate: 300 },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch countries: ${response.status}`);
	}

	return response.json() as Promise<Country[]>;
}
