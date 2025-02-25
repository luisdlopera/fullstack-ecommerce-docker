'use client';

import { useState } from 'react';
import { Button, Image, Tooltip } from '@heroui/react';
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
				<div className='absolute left-3 top-3 z-20 flex gap-2'>
					{isNew && <span className='z-10 rounded-md bg-black px-2 py-1 text-xs text-white'>Nuevo</span>}
					{discount > 0 && (
						<span className='z-10 rounded-md bg-blue-600 px-2 py-1 text-xs text-white'>{discount}%</span>
					)}
					{isSoldOut && (
						<span className='z-10 rounded-md bg-red-600 px-2 py-1 text-xs text-white'>Agotado</span>
					)}
				</div>

				<div className='flex justify-center cursor-pointer'>
					<Image
						src={image}
						alt={name}
						className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${hover ? 'absolute opacity-0' : 'opacity-100'
							}`}
					/>
					<Image
						src={image2}
						alt={name}
						className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${hover ? 'opacity-100' : 'absolute opacity-0'
							}`}
					/>
				</div>

				{hover && (
					<div className='absolute right-3 top-3 z-20 flex flex-col gap-2'>
						<Tooltip content="Agregar a favoritos" className='text-black'>
							<Button isIconOnly className='w-14 h-14 bg-white p-2 shadow-md hover:bg-gray-200'>
								<Heart />
							</Button>
						</Tooltip>
						<Tooltip content="Agregar al carrito" className='text-black'>
							<Button isIconOnly className=' w-14 h-14 bg-white p-2 shadow-md hover:bg-gray-200'>
								<ShoppingCart />
							</Button>
						</Tooltip>
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
