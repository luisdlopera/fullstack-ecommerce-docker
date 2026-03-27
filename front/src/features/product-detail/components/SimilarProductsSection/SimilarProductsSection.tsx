'use client';

import { SimilarProductCard } from '../SimilarProductCard';
import type { SimilarProductsSectionProps } from './types';

export function SimilarProductsSection({ products, title = 'Productos relacionados' }: SimilarProductsSectionProps) {
	if (products.length === 0) return null;

	return (
		<section className='mt-10 border-t border-neutral-200/80 pt-10'>
			<div className='mb-8 text-center'>
				<h2 className='text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl'>{title}</h2>
				<p className='mx-auto mt-1 max-w-md text-sm text-neutral-500'>Selecciones que combinan con tu estilo</p>
			</div>
			<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
				{products.map((p) => (
					<SimilarProductCard key={p.id} product={p} />
				))}
			</div>
		</section>
	);
}
