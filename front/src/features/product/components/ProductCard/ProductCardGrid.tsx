'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductBadge } from '@/features/collection/components/ProductBadge';
import { ProductPriceBlock } from '@/components/shared/product-card';
import type { ProductCardViewModel } from '../../types/product-card-model';

export function ProductCardGrid({ model }: { model: ProductCardViewModel }) {
	const [hover, setHover] = useState(false);
	const href = `/products/${model.slug}`;
	const showSecond = Boolean(model.image2) && hover;

	return (
		<article
			className='group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg'
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<Link href={href} className='relative aspect-[4/5] w-full overflow-hidden bg-neutral-100'>
				<div className='absolute top-3 left-3 z-10 flex flex-wrap gap-1.5'>
					{model.isNew && <ProductBadge kind='new' />}
					{model.discountPercent > 0 && (
						<ProductBadge kind='discount' discountPercent={model.discountPercent} />
					)}
					{model.isSoldOut && <ProductBadge kind='soldOut' />}
				</div>
				<Image
					src={showSecond ? (model.image2 as string) : model.image}
					alt={model.title}
					fill
					className='object-cover transition duration-500 ease-out group-hover:scale-[1.03]'
					sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				/>
			</Link>
			<div className='flex flex-col gap-1 px-4 py-4'>
				<Link
					href={href}
					className='line-clamp-2 text-base font-semibold text-neutral-900 hover:text-[#343DCB]'
				>
					{model.title}
				</Link>
				<ProductPriceBlock price={model.price} comparePrice={model.comparePrice} />
			</div>
		</article>
	);
}
