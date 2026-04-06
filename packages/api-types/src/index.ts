/** Shared API DTO shapes for Nexstore storefront ↔ Nest. */

export type ProductImage = {
	id: number;
	url: string;
	storageKey?: string | null;
	storageProvider?: string | null;
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

export type FavoriteItem = {
	productId: string;
	slug: string;
	title: string;
	price: number;
	image: string;
	imageStorageKey?: string | null;
	imageStorageProvider?: string | null;
};

export type FavoritesListResponse = {
	data: FavoriteItem[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type UserAddress = {
	id: string;
	firstName: string;
	lastName: string;
	address: string;
	address2?: string | null;
	postalCode: string;
	city: string;
	phone: string;
	countryId: string;
	country?: Country;
};

export type UserAddressListResponse = {
	data: UserAddress[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};
