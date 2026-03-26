import { describe, expect, it } from 'vitest';
import { countAvailability, filterCatalogProducts, paginateCatalog } from './filterCatalog';
import type { ActiveFilters, CatalogProduct } from './types';

const baseProduct = (over: Partial<CatalogProduct>): CatalogProduct => ({
	id: '1',
	slug: 'p1',
	name: 'Camiseta Test',
	price: 100,
	comparePrice: null,
	image: '/a.png',
	isNew: false,
	isSoldOut: false,
	discountPercent: 0,
	categoryName: 'Tops',
	collection: 'men',
	sizes: ['M', 'L'],
	colors: ['negro'],
	tags: ['urban'],
	collections: ['core'],
	classification: ['essential'],
	...over,
});

const emptyFilters = (searchQuery = ''): ActiveFilters => ({
	sizes: [],
	availability: 'all',
	categories: [],
	colors: [],
	priceMin: null,
	priceMax: null,
	collections: [],
	tags: [],
	classifications: [],
	searchQuery,
});

describe('filterCatalogProducts', () => {
	const products = [
		baseProduct({ id: '1', name: 'Alpha Hoodie', tags: ['nuevo', 'urban'] }),
		baseProduct({ id: '2', name: 'Beta Pants', categoryName: 'Bottoms', isSoldOut: true }),
	];

	it('filters by search query case-insensitively', () => {
		const f = emptyFilters('alpha');
		expect(filterCatalogProducts(products, f)).toHaveLength(1);
		expect(filterCatalogProducts(products, f)[0].id).toBe('1');
	});

	it('filters by availability inStock', () => {
		const f: ActiveFilters = { ...emptyFilters(), availability: 'inStock' };
		const r = filterCatalogProducts(products, f);
		expect(r.every((p) => !p.isSoldOut)).toBe(true);
		expect(r).toHaveLength(1);
	});

	it('filters by price range', () => {
		const list = [baseProduct({ id: 'a', price: 50 }), baseProduct({ id: 'b', price: 150 })];
		const f: ActiveFilters = { ...emptyFilters(), priceMin: 80, priceMax: 120 };
		expect(filterCatalogProducts(list, f)).toHaveLength(0);
		const f2: ActiveFilters = { ...emptyFilters(), priceMin: 40, priceMax: 60 };
		expect(filterCatalogProducts(list, f2)).toHaveLength(1);
	});
});

describe('paginateCatalog', () => {
	const items = Array.from({ length: 25 }, (_, i) => i);

	it('returns first page and totalPages', () => {
		const { pageItems, totalPages } = paginateCatalog(items, 1, 10);
		expect(pageItems).toHaveLength(10);
		expect(totalPages).toBe(3);
	});

	it('clamps page to valid range', () => {
		const { pageItems } = paginateCatalog(items, 99, 10);
		expect(pageItems).toHaveLength(5);
	});
});

describe('countAvailability', () => {
	it('counts stock states', () => {
		const list = [baseProduct({ isSoldOut: false }), baseProduct({ isSoldOut: true })];
		expect(countAvailability(list)).toEqual({ inStock: 1, outOfStock: 1 });
	});
});
