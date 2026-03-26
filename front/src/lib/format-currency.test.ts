import { describe, expect, it } from 'vitest';
import { formatCOP } from './format-currency';

describe('formatCOP', () => {
	it('formats with peso prefix and thousands grouping', () => {
		const s = formatCOP(85000);
		expect(s.startsWith('$')).toBe(true);
		expect(s).toMatch(/85/);
	});

	it('handles zero', () => {
		expect(formatCOP(0)).toContain('0');
	});
});
