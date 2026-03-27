import { describe, expect, it } from 'vitest';
import { buildClientFetchFilters, buildProductListFilters, requiresClientSideFiltering } from './catalog-api-filters';
import { emptyDraftFilters } from '../constants';

describe('catalog-api-filters', () => {
	it('requiresClientSideFiltering is false (server-side list)', () => {
		expect(requiresClientSideFiltering('men', { ...emptyDraftFilters(), sizes: ['M'] })).toBe(false);
	});

	it('buildProductListFilters combines collection mustTag and sidebar anyTags', () => {
		const f = buildProductListFilters('new', '', { ...emptyDraftFilters(), tags: ['urban'] });
		expect(f.mustTag).toBe('nuevo');
		expect(f.anyTags).toEqual(['urban']);
	});

	it('buildProductListFilters maps collection and search', () => {
		const f = buildProductListFilters('women', 'vestido', emptyDraftFilters());
		expect(f.gender).toBe('women');
		expect(f.query).toBe('vestido');
		expect(f.mustTag).toBeUndefined();
	});

	it('buildClientFetchFilters maps kids and search', () => {
		const f = buildClientFetchFilters('kids', 'pantalón');
		expect(f.gender).toBe('kid');
		expect(f.query).toBe('pantalón');
	});
});
