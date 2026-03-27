'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductsClient, type ProductListResponse } from '@/lib/api';
import { PAGE_SIZE } from '../constants';
import { buildProductListFilters } from '../lib/catalog-api-filters';
import { countAvailability } from '../lib/filterCatalog';
import { mapProductToCatalog } from '../lib/mapApiProduct';
import type { CatalogProduct, CollectionSlug, SidebarDraftFilters } from '../types';

type UseProductListingLoadArgs = {
	collection: CollectionSlug;
	searchQuery: string;
	appliedFilters: SidebarDraftFilters;
	page: number;
	replaceCatalogQuery: (u: { page?: number }) => void;
};

export function useProductListingLoad({
	collection,
	searchQuery,
	appliedFilters,
	page,
	replaceCatalogQuery,
}: UseProductListingLoadArgs) {
	const [serverPayload, setServerPayload] = useState<ProductListResponse | null>(null);
	const [facetCatalog, setFacetCatalog] = useState<CatalogProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const loadServer = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		try {
			const filters = buildProductListFilters(collection, searchQuery, appliedFilters);
			const [pageRes, facetRes] = await Promise.all([
				fetchProductsClient({ ...filters, page, limit: PAGE_SIZE }),
				fetchProductsClient({ ...filters, page: 1, limit: 100 }),
			]);
			setServerPayload(pageRes);
			setFacetCatalog(facetRes.data.map((p) => mapProductToCatalog(p, collection)));
		} catch (e) {
			setLoadError(e instanceof Error ? e.message : 'Error de red');
			setServerPayload(null);
			setFacetCatalog([]);
		} finally {
			setLoading(false);
		}
	}, [collection, searchQuery, appliedFilters, page]);

	useEffect(() => {
		void loadServer();
	}, [loadServer]);

	const facetSource = facetCatalog;

	const availability = useMemo(() => countAvailability(facetSource), [facetSource]);

	const categoryNames = useMemo(() => {
		const s = new Set<string>();
		for (const p of facetSource) {
			if (p.categoryName) s.add(p.categoryName);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [facetSource]);

	const { pageItems, totalPages } = useMemo(() => {
		if (!serverPayload) {
			return { pageItems: [] as CatalogProduct[], totalPages: 1 };
		}
		const mapped = serverPayload.data.map((p) => mapProductToCatalog(p, collection));
		return { pageItems: mapped, totalPages: serverPayload.meta.totalPages };
	}, [serverPayload, collection]);

	useEffect(() => {
		if (loading || loadError) return;
		if (page > totalPages) {
			replaceCatalogQuery({ page: totalPages });
		}
	}, [loading, loadError, page, totalPages, replaceCatalogQuery]);

	const load = useCallback(() => {
		void loadServer();
	}, [loadServer]);

	return {
		loading,
		loadError,
		pageItems,
		totalPages,
		availability,
		categoryNames,
		load,
	};
}
