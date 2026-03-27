'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCOP } from '@/lib/format-currency';
import type { ProductCardViewModel } from '../../types/product-card-model';

export function ProductCardSimilar({ model }: { model: ProductCardViewModel }) {
	const href = `/products/${model.slug}`;

	return (
		<article className='group'>
			<Link href={href} className='block'>
				<div className='relative overflow-hidden rounded-[24px] bg-white p-3 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg'>
					<div className='absolute top-4 left-4 z-10 flex flex-wrap gap-2'>
						{model.highlightBadge && (
							<span className='rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white'>
								{model.highlightBadge}
							</span>
						)}
						{model.discountBadge && (
							<span className='rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white'>
								{model.discountBadge}
							</span>
						)}
					</div>
					<div className='relative aspect-[3/4] w-full overflow-hidden rounded-[18px] bg-neutral-100'>
						<Image
							src={model.image}
							alt={model.title}
							fill
							sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
							className='object-cover transition duration-500 group-hover:scale-[1.03]'
						/>
					</div>
				</div>
				<div className='px-2 pt-4 text-center'>
					<h3 className='text-base font-medium text-neutral-900'>{model.title}</h3>
					<p className='mt-1 text-sm text-neutral-500'>{formatCOP(model.price)}</p>
				</div>
			</Link>
		</article>
	);
}
