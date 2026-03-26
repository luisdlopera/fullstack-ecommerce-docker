'use client';

import { useState } from 'react';
import { Button, Image, Tooltip } from '@heroui/react';
import { Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { getClientApiUrl, type Product } from '@/lib/api';

interface ProductCardProps {
	id?: string;
	name: string;
	price: number;
	image: string;
	image2?: string;
	slug?: string;
	isNew?: boolean;
	discount?: number;
	isSoldOut?: boolean;
}

export function ProductCard({
	id,
	name,
	price,
	image,
	image2,
	slug,
	isNew = false,
	discount = 0,
	isSoldOut = false,
}: ProductCardProps) {
	const [hover, setHover] = useState<boolean>(false);
	const [addingToCart, setAddingToCart] = useState(false);
	const router = useRouter();
	const { isFavorite, toggleFavorite } = useFavorites();
	const { addItem, items: cartItems } = useCart();
	const favorite = slug ? isFavorite(slug) : false;
	const inCart = slug ? cartItems.some((i) => i.slug === slug) : false;

	const productHref = slug ? `/products/${slug}` : '#';

	const handleToggleFavorite = () => {
		if (!slug) return;
		toggleFavorite({
			productId: id ?? slug,
			slug,
			title: name,
			price,
			image,
		});
	};

	const handleAddToCart = async () => {
		if (!slug || isSoldOut) return;
		setAddingToCart(true);
		try {
			const res = await fetch(`${getClientApiUrl()}/products/${slug}`);
			if (!res.ok) {
				router.push(productHref);
				return;
			}
			const product = (await res.json()) as Product;
			if (product.inStock === 0 || product.sizes.length === 0) return;
			const defaultSize =
				product.sizes.find((s) => s === 'M') ??
				product.sizes.find((s) => s === 'L') ??
				product.sizes[Math.floor(product.sizes.length / 2)] ??
				product.sizes[0];
			const img =
				product.ProductImage.length > 0 ? product.ProductImage[0].url : image;
			addItem({
				productId: product.id,
				slug: product.slug,
				title: product.title,
				price: product.price,
				size: defaultSize,
				quantity: 1,
				image: img,
			});
		} finally {
			setAddingToCart(false);
		}
	};

	const card = (
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

				{slug ? (
					<Link href={productHref} className='flex cursor-pointer justify-center'>
						<Image
							src={image}
							alt={name}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'absolute opacity-0' : 'opacity-100'
							}`}
						/>
						<Image
							src={image2 || image}
							alt={name}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'opacity-100' : 'absolute opacity-0'
							}`}
						/>
					</Link>
				) : (
					<div className='flex cursor-pointer justify-center'>
						<Image
							src={image}
							alt={name}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'absolute opacity-0' : 'opacity-100'
							}`}
						/>
						<Image
							src={image2 || image}
							alt={name}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'opacity-100' : 'absolute opacity-0'
							}`}
						/>
					</div>
				)}

				{hover && (
					<div className='absolute right-3 top-3 z-20 flex flex-col gap-2'>
						<Tooltip content='Agregar a favoritos' className='text-black'>
							<Button
								isIconOnly
								className='h-14 w-14 bg-white p-2 shadow-md hover:bg-gray-200'
								onPress={() => handleToggleFavorite()}
							>
								<Heart className={favorite ? 'text-red-500' : ''} fill={favorite ? 'currentColor' : 'none'} />
							</Button>
						</Tooltip>
						<Tooltip content={inCart ? 'En el carrito' : 'Agregar al carrito'} className='text-black'>
							<Button
								isIconOnly
								className='h-14 w-14 bg-white p-2 shadow-md hover:bg-gray-200'
								onPress={() => void handleAddToCart()}
								isDisabled={!slug || isSoldOut}
								isLoading={addingToCart}
							>
								<ShoppingCart
									className={inCart ? 'text-primary' : ''}
									fill={inCart ? 'currentColor' : 'none'}
								/>
							</Button>
						</Tooltip>
					</div>
				)}
			</div>

			{slug ? (
				<Link href={productHref} className='mt-4 block text-center'>
					<h3 className='mx-auto flex w-full text-lg font-semibold text-black'>{name}</h3>
					<p className='text-black'>${price.toFixed(2)}</p>
				</Link>
			) : (
				<div className='mt-4 text-center'>
					<h3 className='mx-auto flex w-full text-lg font-semibold text-black'>{name}</h3>
					<p className='text-black'>${price.toFixed(2)}</p>
				</div>
			)}
		</div>
	);

	return card;
}
