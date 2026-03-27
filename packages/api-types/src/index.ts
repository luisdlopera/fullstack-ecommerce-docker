/** Shared API DTO shapes for Nexstore storefront ↔ Nest. */

export type ProductImage = {
	id: number;
	url: string;
};

export type Category = {
	id: string;
	name: string;
};

export type Product = {
	id: string;
	title: string;
	description: string;
	inStock: number;
	price: number;
	comparePrice?: number | null;
	sizes: string[];
	slug: string;
	tags: string[];
	gender: string;
	categoryId: string;
	ProductImage: ProductImage[];
	category: Category;
};

export type ProductListResponse = {
	data: Product[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type ProductFacets = {
	inStockCount: number;
	outOfStockCount: number;
	categoryNames: string[];
};

export type ProductFilters = {
	page?: number;
	limit?: number;
	query?: string;
	category?: string;
	/** @deprecated Prefer mustTag for collection filters */
	tag?: string;
	mustTag?: string;
	anyTags?: string[];
	gender?: string;
	minPrice?: number;
	maxPrice?: number;
	inStock?: boolean;
	avail?: 'in' | 'out';
	sizes?: string[];
	colors?: string[];
	categories?: string[];
	colSlugs?: string[];
	classifications?: string[];
};

export type Country = {
	id: string;
	name: string;
};
