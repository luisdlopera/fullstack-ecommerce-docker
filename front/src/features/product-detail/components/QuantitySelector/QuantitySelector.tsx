'use client';

import { Minus, Plus } from 'lucide-react';
import type { QuantitySelectorProps } from './types';

export function QuantitySelector({ value, min = 1, max, onChange, disabled }: QuantitySelectorProps) {
	return (
		<div className='flex h-12 items-center justify-center gap-1 rounded-2xl border border-neutral-200 bg-white px-2 shadow-sm'>
			<button
				type='button'
				disabled={disabled || value <= min}
				onClick={() => onChange(Math.max(min, value - 1))}
				className='flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30'
				aria-label='Disminuir cantidad'
			>
				<Minus className='h-4 w-4' />
			</button>
			<span className='min-w-[2.5rem] text-center text-sm font-semibold text-neutral-900 tabular-nums'>
				{value}
			</span>
			<button
				type='button'
				disabled={disabled || value >= max}
				onClick={() => onChange(Math.min(max, value + 1))}
				className='flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30'
				aria-label='Aumentar cantidad'
			>
				<Plus className='h-4 w-4' />
			</button>
		</div>
	);
}
