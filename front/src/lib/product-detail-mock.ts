/** Mock PDP is only allowed in development to avoid accidental production use. */
export function isProductDetailMockEnabled(): boolean {
	return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_PRODUCT_DETAIL_USE_MOCK === 'true';
}
