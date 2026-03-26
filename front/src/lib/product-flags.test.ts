import { describe, expect, it } from 'vitest';
import { discountPercent, isNewFromTags } from './product-flags';

describe('isNewFromTags', () => {
	it('detects nuevo case-insensitively', () => {
		expect(isNewFromTags(['Nuevo', 'urban'])).toBe(true);
		expect(isNewFromTags(['nuevo'])).toBe(true);
		expect(isNewFromTags(['urban'])).toBe(false);
		expect(isNewFromTags(undefined)).toBe(false);
	});
});

describe('discountPercent', () => {
	it('returns 0 when no compare or invalid', () => {
		expect(discountPercent(100, null)).toBe(0);
		expect(discountPercent(100, 100)).toBe(0);
		expect(discountPercent(100, 90)).toBe(0);
	});

	it('computes rounded percent', () => {
		expect(discountPercent(80, 100)).toBe(20);
	});
});
