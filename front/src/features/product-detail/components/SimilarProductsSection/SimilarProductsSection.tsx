'use client';

import 'swiper/css';
import { useMemo } from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { SimilarProductCard } from '../SimilarProductCard';
import type { SimilarProduct } from '../../types';
import type { SimilarProductsSectionProps } from './types';

const MIN_SLIDES_FOR_LOOP = 8;

function slidesForLoop(products: SimilarProduct[]): SimilarProduct[] {
	if (products.length <= 1) return products;
	if (products.length >= MIN_SLIDES_FOR_LOOP) return products;
	const out: SimilarProduct[] = [];
	for (let i = 0; i < MIN_SLIDES_FOR_LOOP; i++) {
		out.push(products[i % products.length]);
	}
	return out;
}

export function SimilarProductsSection({ products, title = 'Productos relacionados' }: SimilarProductsSectionProps) {
	const loopSlides = useMemo(() => slidesForLoop(products), [products]);

	if (products.length === 0) return null;

	const enableLoop = loopSlides.length > 1;

	return (
		<section className='mt-10 border-t border-neutral-200/80 pt-10'>
			<div className='mb-8 text-center'>
				<h2 className='text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl'>{title}</h2>
				<p className='mx-auto mt-1 max-w-md text-sm text-neutral-500'>Selecciones que combinan con tu estilo</p>
			</div>
			<Swiper
				modules={[Autoplay]}
				spaceBetween={24}
				speed={600}
				grabCursor
				watchSlidesProgress
				loop={enableLoop}
				loopAdditionalSlides={Math.min(loopSlides.length, 6)}
				autoplay={
					enableLoop
						? {
								delay: 2800,
								disableOnInteraction: false,
								pauseOnMouseEnter: true,
							}
						: false
				}
				breakpoints={{
					0: { slidesPerView: 1.15 },
					640: { slidesPerView: 2 },
					1024: { slidesPerView: 3 },
					1280: { slidesPerView: 4 },
				}}
				className='pb-1'
			>
				{loopSlides.map((p, index) => (
					<SwiperSlide key={`${p.id}-${index}`}>
						<SimilarProductCard product={p} />
					</SwiperSlide>
				))}
			</Swiper>
		</section>
	);
}
