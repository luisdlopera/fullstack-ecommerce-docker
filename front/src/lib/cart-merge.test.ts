import { describe, expect, it } from 'vitest';
import { addOrMergeCartLine, type CartLine } from './cart-merge';

const line = (over: Partial<CartLine> = {}): CartLine => ({
	productId: 'p1',
	slug: 's1',
	title: 'T',
	price: 10,
	size: 'M',
	quantity: 1,
	image: '/i.png',
	...over,
});

describe('addOrMergeCartLine', () => {
	it('appends new line when size differs', () => {
		const prev = [line({ size: 'S' })];
		const next = addOrMergeCartLine(prev, line({ size: 'M' }));
		expect(next).toHaveLength(2);
	});

	it('merges quantity for same product and size', () => {
		const prev = [line({ quantity: 2 })];
		const next = addOrMergeCartLine(prev, line({ quantity: 3 }));
		expect(next).toHaveLength(1);
		expect(next[0].quantity).toBe(5);
	});

	it('treats different productId as separate lines even with same size', () => {
		const prev = [line({ productId: 'a', size: 'M' })];
		const next = addOrMergeCartLine(prev, line({ productId: 'b', size: 'M' }));
		expect(next).toHaveLength(2);
	});
});
