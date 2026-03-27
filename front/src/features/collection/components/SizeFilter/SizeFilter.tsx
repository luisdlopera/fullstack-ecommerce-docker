'use client';

import { SIZE_OPTIONS } from '../../constants';
import type { SizeFilterProps } from './types';

export function SizeFilter({ selected, onToggle }: SizeFilterProps) {
	return (
		<div>
			<p className='mb-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase'>Tallas</p>
			<div className='flex flex-wrap gap-2'>
				{SIZE_OPTIONS.map((size) => {
					const on = selected.includes(size);
					return (
						<button
							key={size}
							type='button'
							onClick={() => onToggle(size)}
							className={
								on
									? 'rounded-full border border-[#343DCB] bg-[#343DCB]/10 px-3 py-1.5 text-xs font-semibold text-[#343DCB]'
									: 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-300'
							}
						>
							{size}
						</button>
					);
				})}
			</div>
		</div>
	);
}
