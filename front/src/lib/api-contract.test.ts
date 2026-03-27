import { describe, expect, it } from 'vitest';
import { appendProductFiltersToSearchParams } from '@/lib/api';
import type { ProductListResponse } from '@nexstore/api-types';

describe('appendProductFiltersToSearchParams', () => {
	it('matches list query shape used by ProductListResponse requests', () => {
		const params = new URLSearchParams();
		appendProductFiltersToSearchParams(params, {
			page: 2,
			limit: 12,
			gender: 'men',
			mustTag: 'jeans',
			avail: 'in',
		});
		expect(params.get('page')).toBe('2');
		expect(params.get('limit')).toBe('12');
		expect(params.get('gender')).toBe('men');
		expect(params.get('mustTag')).toBe('jeans');
		expect(params.get('avail')).toBe('in');
	});
});

describe('ProductListResponse typing', () => {
	it('accepts minimal meta + data', () => {
		const body: ProductListResponse = {
			data: [],
			meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
		};
		expect(body.meta.totalPages).toBe(1);
	});
});
