'use client';

import { ChevronDown } from 'lucide-react';
import type { FilterSectionProps } from './types';

export function FilterSection({ title, children }: FilterSectionProps) {
	return (
		<details className='group rounded-xl border border-neutral-100 bg-white open:border-neutral-200 open:shadow-sm'>
			<summary className='flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-neutral-800'>
				{title}
				<ChevronDown className='h-4 w-4 shrink-0 text-neutral-400 transition group-open:rotate-180' />
			</summary>
			<div className='border-t border-neutral-100 px-4 py-3 text-sm text-neutral-600'>{children}</div>
		</details>
	);
}
