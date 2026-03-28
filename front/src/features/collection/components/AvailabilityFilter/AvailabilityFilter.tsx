'use client';

import { Radio, RadioGroup } from '@heroui/react';
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
			<RadioGroup
				value={mode}
				onValueChange={(v) => onChange(v as AvailabilityFilterMode)}
				classNames={{ wrapper: 'gap-0' }}
				className='flex flex-col rounded-xl border border-neutral-100 bg-neutral-50/50 p-1'
			>
				{rows.map(({ label, value, countOf }) => {
					const count = countOf === 'all' ? total : countOf === 'in' ? inStockCount : outOfStockCount;
					return (
						<Radio
							key={value}
							value={value}
							size='sm'
							classNames={{
								base: 'm-0 max-w-full border-0 bg-transparent p-0 shadow-none hover:bg-neutral-50',
								wrapper: 'mr-2',
								label: 'w-full text-sm text-neutral-800',
							}}
						>
							<span className='flex w-full min-w-0 items-center justify-between gap-3'>
								<span>{label}</span>
								<span className='shrink-0 text-neutral-400 tabular-nums'>({count})</span>
							</span>
						</Radio>
					);
				})}
			</RadioGroup>
		</div>
	);
}
