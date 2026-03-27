'use client';

import type { ColorSelectorProps } from './types';

export function ColorSelector({
	colors,
	value,
	onChange,
	disabled,
	label = 'Selecciona un color',
}: ColorSelectorProps) {
	return (
		<div>
			<p className='mb-2 text-xs font-medium text-neutral-600 md:text-sm'>{label}</p>
			<div className='flex flex-wrap items-center gap-3'>
				{colors.map((color) => {
					const selected = value === color.id;
					return (
						<button
							key={color.id}
							type='button'
							title={color.label}
							disabled={disabled}
							onClick={() => onChange(color.id)}
							className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
								selected ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-transparent'
							} disabled:cursor-not-allowed disabled:opacity-40`}
						>
							<span
								className='h-8 w-8 rounded-full border border-black/10 shadow-inner'
								style={{ backgroundColor: color.hex }}
							/>
						</button>
					);
				})}
			</div>
			{value && <p className='mt-2 text-xs text-neutral-500'>{colors.find((c) => c.id === value)?.label}</p>}
		</div>
	);
}
