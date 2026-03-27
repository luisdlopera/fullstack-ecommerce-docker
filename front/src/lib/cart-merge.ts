/** Lógica pura del carrito (testeable sin React). */

export type CartLine = {
	productId: string;
	slug: string;
	title: string;
	price: number;
	size: string;
	quantity: number;
	image: string;
};

export function addOrMergeCartLine(prev: CartLine[], newItem: CartLine): CartLine[] {
	const idx = prev.findIndex((i) => i.productId === newItem.productId && i.size === newItem.size);
	if (idx >= 0) {
		const next = [...prev];
		next[idx] = { ...next[idx], quantity: next[idx].quantity + newItem.quantity };
		return next;
	}
	return [...prev, newItem];
}
