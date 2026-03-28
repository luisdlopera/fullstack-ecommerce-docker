'use client';

import { Checkbox } from '@heroui/react';
import {
	CLASSIFICATION_OPTIONS,
	COLLECTION_FILTER_OPTIONS,
	COLOR_FILTER_OPTIONS,
	PRICE_PRESETS,
	TAG_FILTER_OPTIONS,
} from '../../constants';
import type { SidebarDraftFilters } from '../../types';
import { AvailabilityFilter } from '../AvailabilityFilter';
import { FilterSection } from '../FilterSection';
import { SizeFilter } from '../SizeFilter';
import type { ProductFiltersSidebarProps } from './types';

function toggle(arr: string[], v: string): string[] {
	return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function setArrayMembership(current: string[], key: string, selected: boolean): string[] {
	if (selected) {
		return current.includes(key) ? current : [...current, key];
	}
	return current.filter((x) => x !== key);
}

const filterCheckboxClassNames = {
	base: 'max-w-full',
	label: 'text-sm text-neutral-800',
} as const;

function draftHasSelections(d: SidebarDraftFilters): boolean {
	return (
		d.sizes.length > 0 ||
		d.availability !== 'all' ||
		d.categories.length > 0 ||
		d.colors.length > 0 ||
		d.priceMin != null ||
		d.priceMax != null ||
		d.collections.length > 0 ||
		d.tags.length > 0 ||
		d.classifications.length > 0
	);
}

const filterActionBtn =
	'min-h-12 w-full rounded-xl py-3 text-sm font-semibold transition sm:flex-1 sm:min-h-0 sm:min-w-0';

export function ProductFiltersSidebar({
	draft,
	onDraftChange,
	categoryNames,
	inStockCount,
	outOfStockCount,
	onApply,
	onClear,
}: ProductFiltersSidebarProps) {
	const set = (patch: Partial<SidebarDraftFilters>) => onDraftChange({ ...draft, ...patch });
	const showClear = draftHasSelections(draft);

	return (
		<aside className='flex h-full flex-col gap-6'>
			<div>
				<h2 className='text-lg font-bold text-neutral-900'>Filtros</h2>
				<p className='mt-1 text-sm text-neutral-500'>Ajusta a tu conveniencia</p>
			</div>

			<SizeFilter selected={draft.sizes} onToggle={(size) => set({ sizes: toggle(draft.sizes, size) })} />

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
							<Checkbox
								key={name}
								size='sm'
								classNames={filterCheckboxClassNames}
								isSelected={draft.categories.includes(name)}
								onValueChange={(selected) =>
									set({ categories: setArrayMembership(draft.categories, name, selected) })
								}
							>
								{name}
							</Checkbox>
						))}
					</div>
				</FilterSection>

				<FilterSection title='Colores'>
					<div className='flex flex-col gap-2'>
						{COLOR_FILTER_OPTIONS.map(({ slug, label }) => (
							<Checkbox
								key={slug}
								size='sm'
								classNames={filterCheckboxClassNames}
								isSelected={draft.colors.includes(slug)}
								onValueChange={(selected) =>
									set({ colors: setArrayMembership(draft.colors, slug, selected) })
								}
							>
								{label}
							</Checkbox>
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
							<Checkbox
								key={slug}
								size='sm'
								classNames={filterCheckboxClassNames}
								isSelected={draft.collections.includes(slug)}
								onValueChange={(selected) =>
									set({ collections: setArrayMembership(draft.collections, slug, selected) })
								}
							>
								{label}
							</Checkbox>
						))}
					</div>
				</FilterSection>

				<FilterSection title='Etiquetas'>
					<div className='flex flex-col gap-2'>
						{TAG_FILTER_OPTIONS.map(({ slug, label }) => (
							<Checkbox
								key={slug}
								size='sm'
								classNames={filterCheckboxClassNames}
								isSelected={draft.tags.includes(slug)}
								onValueChange={(selected) =>
									set({ tags: setArrayMembership(draft.tags, slug, selected) })
								}
							>
								{label}
							</Checkbox>
						))}
					</div>
				</FilterSection>

				<FilterSection title='Clasificación'>
					<div className='flex flex-col gap-2'>
						{CLASSIFICATION_OPTIONS.map(({ slug, label }) => (
							<Checkbox
								key={slug}
								size='sm'
								classNames={filterCheckboxClassNames}
								isSelected={draft.classifications.includes(slug)}
								onValueChange={(selected) =>
									set({
										classifications: setArrayMembership(draft.classifications, slug, selected),
									})
								}
							>
								{label}
							</Checkbox>
						))}
					</div>
				</FilterSection>
			</div>

			<div className='mt-auto flex flex-col gap-2 sm:flex-row sm:items-stretch'>
				{showClear && (
					<button
						type='button'
						onClick={onClear}
						className={`${filterActionBtn} border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50`}
					>
						Limpiar filtros
					</button>
				)}
				<button
					type='button'
					onClick={onApply}
					className={`${filterActionBtn} bg-[#343DCB] text-white shadow-sm hover:bg-[#2f37b7]`}
				>
					Aplicar filtros
				</button>
			</div>
		</aside>
	);
}
