import type { ProductFilters } from '@/lib/api';
import { collectionToApiParams, emptyDraftFilters } from '../constants';
import type { CollectionSlug, SidebarDraftFilters } from '../types';

/** Todo el filtrado relevante se delega al API. */
export function requiresClientSideFiltering(collection: CollectionSlug, applied: SidebarDraftFilters): boolean {
	void collection;
	void applied;
	return false;
}

export function buildProductListFilters(
	collection: CollectionSlug,
	searchQuery: string,
	applied: SidebarDraftFilters,
): ProductFilters {
	const base = collectionToApiParams(collection);
	const q = searchQuery.trim();
	const mustTag = base.tag?.toLowerCase();

	const filters: ProductFilters = {
		...(base.gender ? { gender: base.gender } : {}),
		...(mustTag ? { mustTag } : {}),
		...(q ? { query: q } : {}),
	};

	if (applied.priceMin != null) filters.minPrice = applied.priceMin;
	if (applied.priceMax != null) filters.maxPrice = applied.priceMax;
	if (applied.availability === 'inStock') filters.avail = 'in';
	if (applied.availability === 'outOfStock') filters.avail = 'out';

	if (applied.categories.length > 0) filters.categories = [...applied.categories];
	if (applied.tags.length > 0) filters.anyTags = applied.tags.map((t) => t.toLowerCase());
	if (applied.sizes.length > 0) filters.sizes = [...applied.sizes];
	if (applied.colors.length > 0) filters.colors = [...applied.colors];
	if (applied.collections.length > 0) filters.colSlugs = [...applied.collections];
	if (applied.classifications.length > 0) filters.classifications = [...applied.classifications];

	return filters;
}

/** @deprecated Solo usado por utilidades legacy; el listado usa `buildProductListFilters`. */
export function buildClientFetchFilters(collection: CollectionSlug, searchQuery: string): ProductFilters {
	return buildProductListFilters(collection, searchQuery, emptyDraftFilters());
}
