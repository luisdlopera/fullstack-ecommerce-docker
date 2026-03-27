import type { CollectionSlug, SidebarDraftFilters } from '../types';

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2X'] as const;

export const PAGE_SIZE = 9;

export const COLOR_FILTER_OPTIONS: { slug: string; label: string }[] = [
	{ slug: 'negro', label: 'Negro' },
	{ slug: 'blanco', label: 'Blanco' },
	{ slug: 'azul', label: 'Azul' },
	{ slug: 'beige', label: 'Beige' },
	{ slug: 'verde', label: 'Verde' },
];

export const COLLECTION_FILTER_OPTIONS: { slug: string; label: string }[] = [
	{ slug: 'core', label: 'Core' },
	{ slug: 'studio', label: 'Studio' },
	{ slug: 'travel', label: 'Travel' },
];

export const TAG_FILTER_OPTIONS: { slug: string; label: string }[] = [
	{ slug: 'urban', label: 'Urban' },
	{ slug: 'sport', label: 'Sport' },
	{ slug: 'minimal', label: 'Minimal' },
	{ slug: 'premium', label: 'Premium' },
	{ slug: 'basics', label: 'Basics' },
	{ slug: 'elegante', label: 'Elegante' },
	{ slug: 'fun', label: 'Fun' },
	{ slug: 'active', label: 'Active' },
];

export const CLASSIFICATION_OPTIONS: { slug: string; label: string }[] = [
	{ slug: 'essential', label: 'Essential' },
	{ slug: 'limited', label: 'Limited' },
	{ slug: 'runway', label: 'Runway' },
];

export const PRICE_PRESETS: { label: string; min: number; max: number }[] = [
	{ label: 'Menos de 80', min: 0, max: 80 },
	{ label: '80 – 120', min: 80, max: 120 },
	{ label: '120 – 180', min: 120, max: 180 },
	{ label: 'Más de 180', min: 180, max: 99999 },
];

export function emptyDraftFilters(): SidebarDraftFilters {
	return {
		sizes: [],
		availability: 'all',
		categories: [],
		colors: [],
		priceMin: null,
		priceMax: null,
		collections: [],
		tags: [],
		classifications: [],
	};
}

export function collectionToApiParams(collection: CollectionSlug): { gender?: string; tag?: string } {
	if (collection === 'men') return { gender: 'men' };
	if (collection === 'women') return { gender: 'women' };
	if (collection === 'kids') return { gender: 'kid' };
	return { tag: 'nuevo' };
}

export function isCollectionSlug(value: string): value is CollectionSlug {
	return value === 'men' || value === 'women' || value === 'kids' || value === 'new';
}
