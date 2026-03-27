import { describe, expect, it } from 'vitest';
import { emptyDraftFilters } from '../constants';
import {
	appendSidebarFiltersToSearchParams,
	parseCatalogPage,
	parseCatalogSearchQuery,
	parseSidebarFiltersFromSearchParams,
} from './catalog-url';

describe('catalog-url', () => {
	it('parseSidebarFiltersFromSearchParams reads repeated keys', () => {
		const sp = new URLSearchParams();
		sp.append('size', 'M');
		sp.append('size', 'L');
		sp.append('color', 'negro');
		sp.append('cat', 'Pantalones');
		sp.append('tag', 'urban');
		sp.append('coll', 'core');
		sp.append('class', 'essential');
		sp.set('priceMin', '80');
		sp.set('priceMax', '120');
		sp.set('avail', 'in');

		const f = parseSidebarFiltersFromSearchParams(sp);
		expect(f.sizes).toEqual(['M', 'L']);
		expect(f.colors).toEqual(['negro']);
		expect(f.categories).toEqual(['Pantalones']);
		expect(f.tags).toEqual(['urban']);
		expect(f.collections).toEqual(['core']);
		expect(f.classifications).toEqual(['essential']);
		expect(f.priceMin).toBe(80);
		expect(f.priceMax).toBe(120);
		expect(f.availability).toBe('inStock');
	});

	it('parseSidebarFiltersFromSearchParams defaults availability', () => {
		const f = parseSidebarFiltersFromSearchParams(new URLSearchParams());
		expect(f).toEqual(emptyDraftFilters());
	});

	it('appendSidebarFiltersToSearchParams round-trips', () => {
		const sp = new URLSearchParams();
		sp.set('page', '2');
		sp.set('q', 'jean');
		const filters = {
			...emptyDraftFilters(),
			sizes: ['S', 'M'],
			availability: 'outOfStock' as const,
			priceMin: 10,
			priceMax: 200,
		};
		appendSidebarFiltersToSearchParams(sp, filters);

		expect(sp.get('page')).toBe('2');
		expect(sp.get('q')).toBe('jean');
		expect(parseSidebarFiltersFromSearchParams(sp)).toEqual(filters);
	});

	it('parseCatalogPage', () => {
		expect(parseCatalogPage(new URLSearchParams())).toBe(1);
		expect(parseCatalogPage(new URLSearchParams('page=3'))).toBe(3);
		expect(parseCatalogPage(new URLSearchParams('page=0'))).toBe(1);
	});

	it('parseCatalogSearchQuery', () => {
		expect(parseCatalogSearchQuery(new URLSearchParams())).toBe('');
		expect(parseCatalogSearchQuery(new URLSearchParams('q=  foo  '))).toBe('foo');
	});
});
