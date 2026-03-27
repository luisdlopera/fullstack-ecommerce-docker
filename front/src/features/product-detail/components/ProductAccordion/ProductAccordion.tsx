'use client';

import { ChevronDown } from 'lucide-react';
import type { ProductAccordionProps } from './types';

export function ProductAccordion({ items }: ProductAccordionProps) {
	return (
		<div className='space-y-3'>
			{items.map((item) => (
				<details
					key={item.id}
					className='group rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm open:shadow-md'
				>
					<summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold tracking-wide text-neutral-800'>
						{item.title}
						<ChevronDown className='h-5 w-5 shrink-0 text-neutral-400 transition group-open:rotate-180' />
					</summary>
					<p className='mt-4 max-w-3xl text-sm leading-relaxed text-neutral-500'>{item.content}</p>
				</details>
			))}
		</div>
	);
}
