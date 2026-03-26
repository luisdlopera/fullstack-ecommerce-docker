'use client';

import type { SidebarDraftFilters } from './types';
import {
  CLASSIFICATION_OPTIONS,
  COLLECTION_FILTER_OPTIONS,
  COLOR_FILTER_OPTIONS,
  PRICE_PRESETS,
  TAG_FILTER_OPTIONS,
} from './constants';
import { SizeFilter } from './SizeFilter';
import { AvailabilityFilter } from './AvailabilityFilter';
import { FilterSection } from './FilterSection';

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

type ProductFiltersSidebarProps = {
  draft: SidebarDraftFilters;
  onDraftChange: (next: SidebarDraftFilters) => void;
  categoryNames: string[];
  inStockCount: number;
  outOfStockCount: number;
  onApply: () => void;
};

export function ProductFiltersSidebar({
  draft,
  onDraftChange,
  categoryNames,
  inStockCount,
  outOfStockCount,
  onApply,
}: ProductFiltersSidebarProps) {
  const set = (patch: Partial<SidebarDraftFilters>) => onDraftChange({ ...draft, ...patch });

  return (
    <aside className='flex h-full flex-col gap-6'>
      <div>
        <h2 className='text-lg font-bold text-neutral-900'>Filtros</h2>
        <p className='mt-1 text-sm text-neutral-500'>Ajusta a tu conveniencia</p>
      </div>

      <SizeFilter
        selected={draft.sizes}
        onToggle={(size) => set({ sizes: toggle(draft.sizes, size) })}
      />

      <AvailabilityFilter
        mode={draft.availability}
        onChange={(availability) => set({ availability })}
        inStockCount={inStockCount}
        outOfStockCount={outOfStockCount}
      />

      <div className='flex flex-col gap-2'>
        <FilterSection title='Categoría'>
          <div className='flex max-h-40 flex-col gap-2 overflow-y-auto'>
            {categoryNames.map((name) => (
              <label key={name} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={draft.categories.includes(name)}
                  onChange={() => set({ categories: toggle(draft.categories, name) })}
                  className='h-4 w-4 rounded border-neutral-300 accent-[#343DCB]'
                />
                {name}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title='Colores'>
          <div className='flex flex-col gap-2'>
            {COLOR_FILTER_OPTIONS.map(({ slug, label }) => (
              <label key={slug} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={draft.colors.includes(slug)}
                  onChange={() => set({ colors: toggle(draft.colors, slug) })}
                  className='h-4 w-4 rounded border-neutral-300 accent-[#343DCB]'
                />
                {label}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title='Rango de precio'>
          <div className='flex flex-col gap-3'>
            <div className='flex gap-2'>
              <input
                type='number'
                min={0}
                step={1}
                placeholder='Mín'
                value={draft.priceMin ?? ''}
                onChange={(e) =>
                  set({ priceMin: e.target.value === '' ? null : Number(e.target.value) })
                }
                className='w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm'
              />
              <input
                type='number'
                min={0}
                step={1}
                placeholder='Máx'
                value={draft.priceMax ?? ''}
                onChange={(e) =>
                  set({ priceMax: e.target.value === '' ? null : Number(e.target.value) })
                }
                className='w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm'
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type='button'
                  onClick={() => set({ priceMin: preset.min, priceMax: preset.max })}
                  className='rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600 hover:border-[#343DCB]/40'
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        <FilterSection title='Colecciones'>
          <div className='flex flex-col gap-2'>
            {COLLECTION_FILTER_OPTIONS.map(({ slug, label }) => (
              <label key={slug} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={draft.collections.includes(slug)}
                  onChange={() => set({ collections: toggle(draft.collections, slug) })}
                  className='h-4 w-4 rounded border-neutral-300 accent-[#343DCB]'
                />
                {label}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title='Etiquetas'>
          <div className='flex flex-col gap-2'>
            {TAG_FILTER_OPTIONS.map(({ slug, label }) => (
              <label key={slug} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={draft.tags.includes(slug)}
                  onChange={() => set({ tags: toggle(draft.tags, slug) })}
                  className='h-4 w-4 rounded border-neutral-300 accent-[#343DCB]'
                />
                {label}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title='Clasificación'>
          <div className='flex flex-col gap-2'>
            {CLASSIFICATION_OPTIONS.map(({ slug, label }) => (
              <label key={slug} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={draft.classifications.includes(slug)}
                  onChange={() => set({ classifications: toggle(draft.classifications, slug) })}
                  className='h-4 w-4 rounded border-neutral-300 accent-[#343DCB]'
                />
                {label}
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      <button
        type='button'
        onClick={onApply}
        className='mt-auto w-full rounded-xl bg-[#343DCB] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f37b7]'
      >
        Aplicar filtros
      </button>
    </aside>
  );
}