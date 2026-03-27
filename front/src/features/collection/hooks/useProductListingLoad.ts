'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProductFacetsClient, fetchProductsClient, type ProductListResponse } from '@/lib/api';
import { PAGE_SIZE } from '../constants';
import { buildProductListFilters } from '../lib/catalog-api-filters';
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
	const [facets, setFacets] = useState<{ inStock: number; outOfStock: number; categoryNames: string[] } | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const loadServer = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		try {
			const filters = buildProductListFilters(collection, searchQuery, appliedFilters);
			const [pageRes, facetRes] = await Promise.all([
				fetchProductsClient({ ...filters, page, limit: PAGE_SIZE }),
				fetchProductFacetsClient(filters),
			]);
			setServerPayload(pageRes);
			setFacets({
				inStock: facetRes.inStockCount,
				outOfStock: facetRes.outOfStockCount,
				categoryNames: facetRes.categoryNames,
			});
		} catch (e) {
			setLoadError(e instanceof Error ? e.message : 'Error de red');
			setServerPayload(null);
			setFacets(null);
		} finally {
			setLoading(false);
		}
	}, [collection, searchQuery, appliedFilters, page]);

	useEffect(() => {
		void loadServer();
	}, [loadServer]);

	const availability = useMemo(
		() => facets ?? { inStock: 0, outOfStock: 0 },
		[facets],
	);

	const categoryNames = useMemo(() => facets?.categoryNames ?? [], [facets]);

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
