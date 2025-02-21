'use client';

import { useState } from 'react';
import { Button, Image } from '@heroui/react';
import { Heart, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
	name: string;
	price: number;
	image: string;
	image2?: string;
	isNew?: boolean;
	discount?: number;
	isSoldOut?: boolean;
}

export function ProductCard({
	name,
	price,
	image,
	image2,
	isNew = false,
	discount = 0,
	isSoldOut = false,
}: ProductCardProps) {
	const [hover, setHover] = useState<boolean>(false);

	return (
		<div className='flex flex-col items-center gap-4'>
			<div
				className='relative h-[355px] w-[290px] rounded-3xl bg-gray-100'
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
			>
				{/* Etiquetas de Nuevo y Descuento */}
				<div className='absolute left-3 top-3 z-20 flex gap-2'>
					{isNew && <span className='z-10 rounded-md bg-black px-2 py-1 text-xs text-white'>Nuevo</span>}
					{discount > 0 && (
						<span className='z-10 rounded-md bg-blue-600 px-2 py-1 text-xs text-white'>{discount}%</span>
					)}
					{isSoldOut && (
						<span className='z-10 rounded-md bg-red-600 px-2 py-1 text-xs text-white'>Agotado</span>
					)}
				</div>

				{/* Imagen del producto */}
				<div className='flex justify-center'>
					<Image
						src={image}
						alt={name}
						className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity ${
							hover ? 'absolute opacity-0' : 'opacity-100'
						}`}
					/>
					<Image
						src={image2}
						alt={name}
						className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity ${
							hover ? 'opacity-100' : 'absolute opacity-0'
						}`}
					/>
				</div>

				{/* Contenido dinámico en hover */}
				{hover && (
					<div className='absolute right-3 top-3 z-20 flex flex-col gap-2'>
						<Button className='rounded-full bg-white p-2 shadow-md hover:bg-gray-200'>
							<Heart />
						</Button>
						<Button className='rounded-full bg-white p-2 shadow-md hover:bg-gray-200'>
							<ShoppingCart />
						</Button>
					</div>
				)}
			</div>

			<div className='mt-4 text-center'>
				<h3 className='mx-auto flex w-full text-lg font-semibold text-black'>{name}</h3>
				<p className='text-black'>${price.toFixed(2)}</p>
			</div>
		</div>
	);
}
