'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { emptyDraftFilters } from '../../constants';
import { useCatalogUrlState } from '../../hooks/useCatalogUrlState';
import { useProductListingLoad } from '../../hooks/useProductListingLoad';
import type { SidebarDraftFilters } from '../../types';
import { CatalogProductGrid } from '../CatalogProductGrid';
import { CatalogListingSkeleton } from '../CatalogListingSkeleton';
import { CollectionHeader } from '../CollectionHeader';
import { Pagination } from '../Pagination';
import { ProductFiltersSidebar } from '../ProductFiltersSidebar';
import { SearchBar } from '../SearchBar';
import type { ProductListingPageProps } from './types';

const MOBILE_FILTERS_TITLE_ID = 'catalog-mobile-filters-title';
const MOBILE_FILTERS_DIALOG_ID = 'catalog-mobile-filters-dialog';

export function ProductListingPage({ collection }: ProductListingPageProps) {
	const { page, searchQuery, filtersFromUrl, replaceCatalogQuery } = useCatalogUrlState();
	const mobileCloseRef = useRef<HTMLButtonElement>(null);

	const [draftFilters, setDraftFilters] = useState<SidebarDraftFilters>(filtersFromUrl);
	const [appliedFilters, setAppliedFilters] = useState<SidebarDraftFilters>(filtersFromUrl);
	const [searchDraft, setSearchDraft] = useState(searchQuery);
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

	useEffect(() => {
		setDraftFilters(filtersFromUrl);
		setAppliedFilters(filtersFromUrl);
	}, [collection, filtersFromUrl]);

	useEffect(() => {
		setSearchDraft(searchQuery);
	}, [searchQuery]);

	const { loading, loadError, pageItems, totalPages, availability, categoryNames, load } = useProductListingLoad({
		collection,
		searchQuery,
		appliedFilters,
		page,
		replaceCatalogQuery,
	});

	useEffect(() => {
		if (!mobileFiltersOpen) return;
		const id = window.requestAnimationFrame(() => mobileCloseRef.current?.focus());
		return () => window.cancelAnimationFrame(id);
	}, [mobileFiltersOpen]);

	useEffect(() => {
		setMobileFiltersOpen(false);
	}, [collection]);

	const applySidebar = () => {
		setAppliedFilters(draftFilters);
		replaceCatalogQuery({ page: 1, filters: draftFilters });
		setMobileFiltersOpen(false);
	};

	const clearSidebar = () => {
		const empty = emptyDraftFilters();
		setDraftFilters(empty);
		setAppliedFilters(empty);
		replaceCatalogQuery({ page: 1, filters: empty });
		setMobileFiltersOpen(false);
	};

	const submitSearch = () => {
		replaceCatalogQuery({ page: 1, q: searchDraft.trim() || null });
	};

	const sidebar = (
		<ProductFiltersSidebar
			draft={draftFilters}
			onDraftChange={setDraftFilters}
			categoryNames={categoryNames}
			inStockCount={availability.inStock}
			outOfStockCount={availability.outOfStock}
			onApply={applySidebar}
			onClear={clearSidebar}
		/>
	);

	return (
		<div className='mx-auto w-[90%] max-w-480 pt-28 pb-16'>
			<div className='flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10'>
				<div className='hidden w-full max-w-70 shrink-0 lg:block'>{sidebar}</div>

				<div className='min-w-0 flex-1'>
					<CollectionHeader collection={collection} />

					<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex-1'>
							<SearchBar value={searchDraft} onChange={setSearchDraft} onSubmit={submitSearch} />
						</div>
						<button
							type='button'
							className='inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm lg:hidden'
							onClick={() => setMobileFiltersOpen(true)}
							aria-expanded={mobileFiltersOpen}
							aria-controls={MOBILE_FILTERS_DIALOG_ID}
						>
							<SlidersHorizontal className='h-4 w-4' aria-hidden />
							Filtros
						</button>
					</div>

					{loading && <CatalogListingSkeleton />}

					{!loading && loadError && (
						<div className='rounded-2xl border border-red-100 bg-red-50/80 px-4 py-6 text-center text-sm text-red-800'>
							{loadError}
							<button
								type='button'
								className='mt-3 block w-full rounded-lg bg-red-600 py-2 text-white sm:mx-auto sm:w-auto sm:px-6'
								onClick={() => void load()}
							>
								Reintentar
							</button>
						</div>
					)}

					{!loading && !loadError && (
						<>
							<CatalogProductGrid products={pageItems} />
							<Pagination
								page={page}
								totalPages={totalPages}
								onPageChange={(p) => replaceCatalogQuery({ page: p })}
							/>
						</>
					)}
				</div>
			</div>

			{mobileFiltersOpen && (
				<div
					id={MOBILE_FILTERS_DIALOG_ID}
					className='fixed inset-0 z-50 flex flex-col bg-white lg:hidden'
					role='dialog'
					aria-modal='true'
					aria-labelledby={MOBILE_FILTERS_TITLE_ID}
				>
					<div className='flex items-center justify-between border-b border-neutral-100 px-4 py-3'>
						<h2 id={MOBILE_FILTERS_TITLE_ID} className='text-base font-bold'>
							Filtros
						</h2>
						<button
							ref={mobileCloseRef}
							type='button'
							className='rounded-lg p-2 text-neutral-600 hover:bg-neutral-100'
							onClick={() => setMobileFiltersOpen(false)}
							aria-label='Cerrar filtros'
						>
							<X className='h-5 w-5' aria-hidden />
						</button>
					</div>
					<div className='flex-1 overflow-y-auto px-4 py-4'>{sidebar}</div>
				</div>
			)}
		</div>
	);
}
