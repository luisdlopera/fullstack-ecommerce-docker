'use client';

import { CreditCard, Truck, Undo2 } from 'lucide-react';
import type { ProductBenefit } from '@/types/product-detail';

const icons = {
	truck: Truck,
	return: Undo2,
	payment: CreditCard,
} as const;

type ProductBenefitsProps = {
	items: ProductBenefit[];
	compact?: boolean;
};

export function ProductBenefits({ items, compact }: ProductBenefitsProps) {
	return (
		<div
			className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${compact ? 'space-y-2 p-3' : 'space-y-3 p-5'}`}
		>
			{items.map((item) => {
				const Icon = icons[item.icon];
				return (
					<div
						key={item.id}
						className={`flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 ${compact ? 'p-2' : 'p-3'}`}
					>
						<div
							className={`flex shrink-0 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-sm ${compact ? 'h-9 w-9' : 'h-11 w-11 rounded-xl'}`}
						>
							<Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} />
						</div>
						<div className='min-w-0'>
							<p
								className={`font-semibold uppercase tracking-wide text-neutral-800 ${compact ? 'text-[10px] leading-tight' : 'text-xs'}`}
							>
								{item.title}
							</p>
							<p
								className={`leading-snug text-neutral-500 ${compact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-sm'}`}
							>
								{item.description}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
