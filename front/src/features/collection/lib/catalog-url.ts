import { emptyDraftFilters } from '../constants';
import type { AvailabilityFilterMode, SidebarDraftFilters } from '../types';

/** Query keys for catalog filters (repeated params where multi-value). */
export const CATALOG_FILTER_KEYS = {
	size: 'size',
	color: 'color',
	category: 'cat',
	tag: 'tag',
	collection: 'coll',
	classification: 'class',
	priceMin: 'priceMin',
	priceMax: 'priceMax',
	avail: 'avail',
} as const;

function uniqNonEmpty(values: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of values) {
		const t = v.trim();
		if (!t || seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	return out;
}

export function parseAvailabilityParam(value: string | null): AvailabilityFilterMode {
	if (value === 'in') return 'inStock';
	if (value === 'out') return 'outOfStock';
	return 'all';
}

export function serializeAvailabilityParam(mode: AvailabilityFilterMode): string | null {
	if (mode === 'inStock') return 'in';
	if (mode === 'outOfStock') return 'out';
	return null;
}

export function parseSidebarFiltersFromSearchParams(searchParams: URLSearchParams): SidebarDraftFilters {
	const f = emptyDraftFilters();
	f.sizes = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.size));
	f.colors = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.color));
	f.categories = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.category));
	f.tags = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.tag));
	f.collections = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.collection));
	f.classifications = uniqNonEmpty(searchParams.getAll(CATALOG_FILTER_KEYS.classification));

	const pm = searchParams.get(CATALOG_FILTER_KEYS.priceMin);
	const px = searchParams.get(CATALOG_FILTER_KEYS.priceMax);
	if (pm != null && pm !== '') {
		const n = Number(pm);
		if (!Number.isNaN(n)) f.priceMin = n;
	}
	if (px != null && px !== '') {
		const n = Number(px);
		if (!Number.isNaN(n)) f.priceMax = n;
	}

	f.availability = parseAvailabilityParam(searchParams.get(CATALOG_FILTER_KEYS.avail));
	return f;
}

/** Remove all catalog filter keys so we can re-append a consistent set. */
export function deleteCatalogFilterParams(sp: URLSearchParams): void {
	for (const k of Object.values(CATALOG_FILTER_KEYS)) {
		sp.delete(k);
	}
}

export function appendSidebarFiltersToSearchParams(sp: URLSearchParams, filters: SidebarDraftFilters): void {
	deleteCatalogFilterParams(sp);
	for (const s of filters.sizes) sp.append(CATALOG_FILTER_KEYS.size, s);
	for (const c of filters.colors) sp.append(CATALOG_FILTER_KEYS.color, c);
	for (const c of filters.categories) sp.append(CATALOG_FILTER_KEYS.category, c);
	for (const t of filters.tags) sp.append(CATALOG_FILTER_KEYS.tag, t);
	for (const c of filters.collections) sp.append(CATALOG_FILTER_KEYS.collection, c);
	for (const c of filters.classifications) sp.append(CATALOG_FILTER_KEYS.classification, c);
	if (filters.priceMin != null) sp.set(CATALOG_FILTER_KEYS.priceMin, String(filters.priceMin));
	if (filters.priceMax != null) sp.set(CATALOG_FILTER_KEYS.priceMax, String(filters.priceMax));
	const av = serializeAvailabilityParam(filters.availability);
	if (av) sp.set(CATALOG_FILTER_KEYS.avail, av);
}

export function parseCatalogPage(searchParams: URLSearchParams): number {
	return Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
}

export function parseCatalogSearchQuery(searchParams: URLSearchParams): string {
	return (searchParams.get('q') ?? '').trim();
}
