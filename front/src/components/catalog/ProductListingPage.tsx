'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ActiveFilters, CatalogProduct, CollectionSlug, SidebarDraftFilters } from './types';
import { collectionToApiParams, emptyDraftFilters } from './constants';
import { mapProductToCatalog } from './mapApiProduct';
import { countAvailability, filterCatalogProducts, paginateCatalog } from './filterCatalog';
import { CollectionHeader } from './CollectionHeader';
import { SearchBar } from './SearchBar';
import { ProductFiltersSidebar } from './ProductFiltersSidebar';
import { ProductGrid } from './ProductGrid';
import { Pagination } from './Pagination';
import { fetchProductsClient, type Product } from '@/lib/api';

const MOBILE_FILTERS_TITLE_ID = 'catalog-mobile-filters-title';

type ProductListingPageProps = { collection: CollectionSlug };

type QueryUpdates = { page?: number; q?: string | null };

export function ProductListingPage({ collection }: ProductListingPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const searchQuery = (searchParams.get('q') ?? '').trim();

  const [raw, setRaw] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<SidebarDraftFilters>(emptyDraftFilters);
  const [appliedFilters, setAppliedFilters] = useState<SidebarDraftFilters>(emptyDraftFilters);
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchDraft(searchQuery);
  }, [searchQuery]);

  const replaceCatalogQuery = useCallback(
    (updates: QueryUpdates) => {
      const sp = new URLSearchParams(searchParams.toString());
      const curPage = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
      const curQ = sp.get('q') ?? '';

      const nextPage = updates.page ?? curPage;
      const nextQ = updates.q !== undefined ? (updates.q ?? '') : curQ;

      if (nextPage <= 1) sp.delete('page');
      else sp.set('page', String(nextPage));

      const trimmed = String(nextQ).trim();
      if (!trimmed) sp.delete('q');
      else sp.set('q', trimmed);

      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const api = collectionToApiParams(collection);
      const json = await fetchProductsClient({
        page: 1,
        limit: 100,
        ...(api.gender ? { gender: api.gender } : {}),
        ...(api.tag ? { tag: api.tag } : {}),
      });
      const mapped = json.data.map((p: Product) => mapProductToCatalog(p, collection));
      setRaw(mapped);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Error de red');
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraftFilters(emptyDraftFilters());
    setAppliedFilters(emptyDraftFilters());
    setMobileFiltersOpen(false);
  }, [collection]);

  const availability = useMemo(() => countAvailability(raw), [raw]);

  const categoryNames = useMemo(() => {
    const s = new Set<string>();
    for (const p of raw) {
      if (p.categoryName) s.add(p.categoryName);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [raw]);

  const active: ActiveFilters = useMemo(
    () => ({ ...appliedFilters, searchQuery }),
    [appliedFilters, searchQuery],
  );

  const filtered = useMemo(() => filterCatalogProducts(raw, active), [raw, active]);
  const { pageItems, totalPages } = useMemo(
    () => paginateCatalog(filtered, page),
    [filtered, page],
  );

  useEffect(() => {
    if (loading || loadError) return;
    if (page > totalPages) {
      replaceCatalogQuery({ page: totalPages });
    }
  }, [loading, loadError, page, totalPages, replaceCatalogQuery]);

  const applySidebar = () => {
    setAppliedFilters(draftFilters);
    replaceCatalogQuery({ page: 1 });
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
    />
  );

  return (
    <div className='mx-auto w-full max-w-7xl px-4 pb-16 pt-28 md:px-6 lg:px-8'>
      <div className='flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10'>
        <div className='hidden w-full max-w-[280px] shrink-0 lg:block'>{sidebar}</div>

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
            >
              <SlidersHorizontal className='h-4 w-4' />
              Filtros
            </button>
          </div>

          {loading && (
            <div className='rounded-2xl border border-neutral-100 bg-neutral-50 py-24 text-center text-neutral-500'>
              Cargando productos…
            </div>
          )}

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
              <ProductGrid products={pageItems} />
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => replaceCatalogQuery({ page: p })} />
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div
          className='fixed inset-0 z-50 flex flex-col bg-white lg:hidden'
          role='dialog'
          aria-modal='true'
          aria-labelledby={MOBILE_FILTERS_TITLE_ID}
        >
          <div className='flex items-center justify-between border-b border-neutral-100 px-4 py-3'>
            <span id={MOBILE_FILTERS_TITLE_ID} className='text-base font-bold'>
              Filtros
            </span>
            <button
              type='button'
              className='rounded-lg p-2 text-neutral-600 hover:bg-neutral-100'
              onClick={() => setMobileFiltersOpen(false)}
              aria-label='Cerrar filtros'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
          <div className='flex-1 overflow-y-auto px-4 py-4'>{sidebar}</div>
        </div>
      )}
    </div>
  );
}
