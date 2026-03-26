/** Whether product tags include the "nuevo" marker (normalized lowercase). */
export function isNewFromTags(tags: string[] | undefined): boolean {
	return (tags ?? []).some((t) => t.toLowerCase() === 'nuevo');
}

export function discountPercent(price: number, compare: number | null | undefined): number {
	if (compare == null || compare <= price) return 0;
	return Math.round(((compare - price) / compare) * 100);
}
