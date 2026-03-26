'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

type ProductGalleryProps = {
	images: string[];
	selectedIndex: number;
	onSelectIndex: (index: number) => void;
	productName: string;
	isNew?: boolean;
	isFavorite?: boolean;
	onToggleFavorite?: () => void;
	className?: string;
};

export function ProductGallery({
	images,
	selectedIndex,
	onSelectIndex,
	productName,
	isNew,
	isFavorite,
	onToggleFavorite,
	className,
}: ProductGalleryProps) {
	const safeIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, images.length - 1));
	const mainSrc = images[safeIndex] ?? '';

	const goPrev = () => {
		if (images.length < 2) return;
		onSelectIndex(safeIndex === 0 ? images.length - 1 : safeIndex - 1);
	};

	const goNext = () => {
		if (images.length < 2) return;
		onSelectIndex(safeIndex === images.length - 1 ? 0 : safeIndex + 1);
	};

	return (
		<div
			className={`flex min-h-0 flex-col gap-5 lg:grid lg:grid-cols-[92px_minmax(0,1fr)] lg:items-start lg:gap-6 ${className ?? ''}`}
		>
			{/* Miniaturas: abajo en móvil, izquierda en desktop */}
			<div className='order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0'>
				{images.map((src, index) => {
					const active = index === safeIndex;
					return (
						<button
							key={`${src}-${index}`}
							type='button'
							onClick={() => onSelectIndex(index)}
							className={`relative shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-1 shadow-sm transition hover:shadow-md lg:h-24 lg:w-24 ${
								active ? 'border-neutral-900' : 'border-neutral-200'
							}`}
						>
							<span className='relative block h-16 w-16 lg:h-[5.25rem] lg:w-[5.25rem]'>
								<Image
									src={src}
									alt={`${productName} vista ${index + 1}`}
									fill
									sizes='96px'
									className='rounded-xl object-cover'
								/>
							</span>
						</button>
					);
				})}
			</div>

			{/* Imagen principal: sin padding; la foto cubre todo el recuadro */}
			<div className='order-1 min-w-0 lg:order-2 lg:h-[640px]'>
				<div className='relative aspect-[4/5] w-full max-h-[min(75vh,640px)] overflow-hidden rounded-[28px] bg-white shadow-sm lg:h-full lg:max-h-none lg:aspect-auto'>
					{isNew && (
						<span className='absolute left-4 top-4 z-10 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white'>
							Nuevo
						</span>
					)}
					{onToggleFavorite && (
						<button
							type='button'
							onClick={onToggleFavorite}
							className='absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-neutral-800 shadow-md backdrop-blur-sm transition hover:scale-105'
							aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
						>
							<Heart
								className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
								strokeWidth={1.75}
							/>
						</button>
					)}
					{images.length > 1 && (
						<>
							<button
								type='button'
								onClick={goPrev}
								className='absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md backdrop-blur-sm transition hover:bg-white'
								aria-label='Imagen anterior'
							>
								<ChevronLeft className='h-5 w-5' />
							</button>
							<button
								type='button'
								onClick={goNext}
								className='absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md backdrop-blur-sm transition hover:bg-white'
								aria-label='Imagen siguiente'
							>
								<ChevronRight className='h-5 w-5' />
							</button>
						</>
					)}
					<Image
						src={mainSrc}
						alt={productName}
						fill
						className='object-cover object-center'
						priority
						sizes='(max-width: 1024px) 100vw, 56vw'
					/>
				</div>
			</div>
		</div>
	);
}
