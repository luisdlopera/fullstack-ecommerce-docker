import type { ActiveFilters, CatalogProduct } from '../types';
import { PAGE_SIZE } from '../constants';

function sizeMatchesProduct(uiSize: string, productSizes: string[]): boolean {
	const api = uiSize === '2X' ? 'XXL' : uiSize;
	return productSizes.some((s) => s.toUpperCase() === api.toUpperCase());
}

export function filterCatalogProducts(products: CatalogProduct[], f: ActiveFilters): CatalogProduct[] {
	const q = f.searchQuery.trim().toLowerCase();
	return products.filter((p) => {
		if (q && !p.name.toLowerCase().includes(q)) return false;

		if (f.sizes.length > 0 && !f.sizes.some((s) => sizeMatchesProduct(s, p.sizes))) return false;

		if (f.availability === 'inStock' && p.isSoldOut) return false;
		if (f.availability === 'outOfStock' && !p.isSoldOut) return false;

		if (f.categories.length > 0 && !f.categories.includes(p.categoryName)) return false;

		if (f.colors.length > 0 && !f.colors.some((c) => p.colors.includes(c))) return false;

		if (f.priceMin != null && p.price < f.priceMin) return false;
		if (f.priceMax != null && p.price > f.priceMax) return false;

		if (f.collections.length > 0 && !f.collections.some((c) => p.collections.includes(c))) return false;

		if (f.tags.length > 0 && !f.tags.some((t) => p.tags.includes(t))) return false;

		if (f.classifications.length > 0 && !f.classifications.some((c) => p.classification.includes(c))) return false;

		return true;
	});
}

export function paginateCatalog<T>(
	items: T[],
	page: number,
	pageSize = PAGE_SIZE,
): { pageItems: T[]; totalPages: number } {
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const safePage = Math.min(Math.max(page, 1), totalPages);
	const start = (safePage - 1) * pageSize;
	return { pageItems: items.slice(start, start + pageSize), totalPages };
}

export function countAvailability(products: CatalogProduct[]): { inStock: number; outOfStock: number } {
	let inStock = 0;
	let outOfStock = 0;
	for (const p of products) {
		if (p.isSoldOut) outOfStock += 1;
		else inStock += 1;
	}
	return { inStock, outOfStock };
}
