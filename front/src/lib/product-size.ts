/**
 * Default size for quick-add / PDP: prefers M, then L, then middle index, then first.
 */
export function pickDefaultSize(sizes: string[]): string | null {
	if (sizes.length === 0) return null;
	const m = sizes.find((s) => s === 'M');
	if (m) return m;
	const l = sizes.find((s) => s === 'L');
	if (l) return l;
	return sizes[Math.floor(sizes.length / 2)] ?? sizes[0];
}
