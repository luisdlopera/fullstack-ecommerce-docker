'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { SimilarProduct } from '@/types/product-detail';
import { formatCOP } from '@/lib/format-currency';

export type SimilarProductCardProps = {
	product: SimilarProduct;
};

/**
 * Tarjeta minimalista para la sección “similares” en la PDP.
 */
export function SimilarProductCard({ product }: SimilarProductCardProps) {
	const href = `/products/${product.slug}`;

	return (
		<article className='group'>
			<Link href={href} className='block'>
				<div className='relative overflow-hidden rounded-[24px] bg-white p-3 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg'>
					<div className='absolute left-4 top-4 z-10 flex flex-wrap gap-2'>
						{product.badge && (
							<span className='rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white'>
								{product.badge}
							</span>
						)}
						{product.discountLabel && (
							<span className='rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white'>
								{product.discountLabel}
							</span>
						)}
					</div>
					<div className='relative aspect-[3/4] w-full overflow-hidden rounded-[18px] bg-neutral-100'>
						<Image
							src={product.image}
							alt={product.name}
							fill
							sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
							className='object-cover transition duration-500 group-hover:scale-[1.03]'
						/>
					</div>
				</div>
				<div className='px-2 pt-4 text-center'>
					<h3 className='text-base font-medium text-neutral-900'>{product.name}</h3>
					<p className='mt-1 text-sm text-neutral-500'>{formatCOP(product.price)}</p>
				</div>
			</Link>
		</article>
	);
}
