'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
	appendSidebarFiltersToSearchParams,
	parseCatalogPage,
	parseCatalogSearchQuery,
	parseSidebarFiltersFromSearchParams,
} from '../lib/catalog-url';
import type { SidebarDraftFilters } from '../types';

export type CatalogQueryUpdates = {
	page?: number;
	q?: string | null;
	/** When set, replaces filter-related query keys. When omitted, keeps current filters in the URL. */
	filters?: SidebarDraftFilters;
};

export function useCatalogUrlState() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const querySignature = searchParams.toString();
	const spSnapshot = useMemo(() => new URLSearchParams(querySignature), [querySignature]);

	const page = useMemo(() => parseCatalogPage(spSnapshot), [spSnapshot]);
	const searchQuery = useMemo(() => parseCatalogSearchQuery(spSnapshot), [spSnapshot]);
	const filtersFromUrl = useMemo(() => parseSidebarFiltersFromSearchParams(spSnapshot), [spSnapshot]);

	const replaceCatalogQuery = useCallback(
		(updates: CatalogQueryUpdates) => {
			const sp = new URLSearchParams(searchParams.toString());
			const curPage = parseCatalogPage(sp);
			const curQ = parseCatalogSearchQuery(sp);

			const nextPage = updates.page ?? curPage;
			const nextQ = updates.q !== undefined ? (updates.q ?? '').trim() : curQ;

			if (nextPage <= 1) sp.delete('page');
			else sp.set('page', String(nextPage));

			if (!nextQ) sp.delete('q');
			else sp.set('q', nextQ);

			if (updates.filters !== undefined) {
				appendSidebarFiltersToSearchParams(sp, updates.filters);
			}

			const qs = sp.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[router, pathname, searchParams],
	);

	return {
		page,
		searchQuery,
		filtersFromUrl,
		replaceCatalogQuery,
	};
}
