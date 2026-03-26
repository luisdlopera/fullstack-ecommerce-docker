import { describe, expect, it } from 'vitest';
import { pickDefaultSize } from './product-size';

describe('pickDefaultSize', () => {
	it('returns null for empty sizes', () => {
		expect(pickDefaultSize([])).toBeNull();
	});

	it('prefers M then L', () => {
		expect(pickDefaultSize(['S', 'M', 'L'])).toBe('M');
		expect(pickDefaultSize(['S', 'L', 'XL'])).toBe('L');
	});

	it('falls back to middle then first', () => {
		expect(pickDefaultSize(['XS', 'S'])).toBe('S');
		expect(pickDefaultSize(['XL'])).toBe('XL');
	});
});
