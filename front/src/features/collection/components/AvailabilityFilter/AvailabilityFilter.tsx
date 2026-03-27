'use client';

import type { AvailabilityFilterMode } from '../../types';
import type { AvailabilityFilterProps } from './types';

const rows: { label: string; value: AvailabilityFilterMode; countOf: 'all' | 'in' | 'out' }[] = [
	{ label: 'Todos', value: 'all', countOf: 'all' },
	{ label: 'Disponibles', value: 'inStock', countOf: 'in' },
	{ label: 'No disponibles', value: 'outOfStock', countOf: 'out' },
];

export function AvailabilityFilter({ mode, onChange, inStockCount, outOfStockCount }: AvailabilityFilterProps) {
	const total = inStockCount + outOfStockCount;

	return (
		<div>
			<p className='mb-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase'>Disponibilidad</p>
			<div className='flex flex-col rounded-xl border border-neutral-100 bg-neutral-50/50 p-1'>
				{rows.map(({ label, value, countOf }) => {
					const count = countOf === 'all' ? total : countOf === 'in' ? inStockCount : outOfStockCount;
					return (
						<label
							key={value}
							className='flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-neutral-50'
						>
							<span className='flex items-center gap-2'>
								<input
									type='radio'
									name='availability'
									checked={mode === value}
									onChange={() => onChange(value)}
									className='h-4 w-4 accent-[#343DCB]'
								/>
								{label}
							</span>
							<span className='text-neutral-400 tabular-nums'>({count})</span>
						</label>
					);
				})}
			</div>
		</div>
	);
}
