'use client';

import { useState } from 'react';
import { Button, Image, Tooltip } from '@heroui/react';
import { Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { ProductPriceBlock, ShopStyleBadges } from '@/components/shared/product-card';
import { useProductCardActions } from '../../hooks/useProductCardActions';
import type { ProductCardViewModel } from '../../types/product-card-model';

type ProductCardShopProps = {
	model: ProductCardViewModel;
	showActions?: boolean;
};

export function ProductCardShop({ model, showActions = true }: ProductCardShopProps) {
	const [hover, setHover] = useState(false);
	const actions = useProductCardActions(model, { favorites: showActions, cart: showActions });
	const favoriteTooltip = actions.favorite ? 'En favoritos' : 'Agregar a favoritos';
	const favoriteAria = actions.favorite ? 'Producto en favoritos' : 'Agregar a favoritos';

	return (
		<div className='flex flex-col items-center gap-4'>
			<div
				className='relative h-[355px] w-[290px] overflow-hidden rounded-3xl bg-gray-100'
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
			>
				<ShopStyleBadges
					isNew={model.isNew}
					discount={model.discountPercent}
					isSoldOut={model.isSoldOut}
					highlightBadge={model.highlightBadge}
					discountBadge={model.discountBadge}
				/>

				{model.slug ? (
					<Link href={actions.productHref} className='flex cursor-pointer justify-center'>
						<Image
							src={model.image}
							alt={model.title}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'absolute opacity-0' : 'opacity-100'
							}`}
						/>
						<Image
							src={model.image2 || model.image}
							alt=''
							aria-hidden
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'opacity-100' : 'absolute opacity-0'
							}`}
						/>
					</Link>
				) : (
					<div className='flex cursor-pointer justify-center'>
						<Image
							src={model.image}
							alt={model.title}
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'absolute opacity-0' : 'opacity-100'
							}`}
						/>
						<Image
							src={model.image2 || model.image}
							alt=''
							aria-hidden
							className={`h-[355px] w-[290px] rounded-3xl object-cover transition-opacity duration-500 ${
								hover ? 'opacity-100' : 'absolute opacity-0'
							}`}
						/>
					</div>
				)}

				{showActions && hover && (
					<div className='absolute top-3 right-3 z-20 flex flex-col gap-2'>
						<Tooltip
							key={actions.favorite ? 'fav-on' : 'fav-off'}
							content={favoriteTooltip}
							placement='bottom'
							classNames={{ base: 'z-[200]' }}
						>
							<Button
								isIconOnly
								aria-label={favoriteAria}
								className='h-14 w-14 bg-white p-2 shadow-md hover:bg-gray-200'
								onPress={() => actions.handleToggleFavorite()}
							>
								<Heart
									className={actions.favorite ? 'text-red-500' : ''}
									fill={actions.favorite ? 'currentColor' : 'none'}
								/>
							</Button>
						</Tooltip>
						<Tooltip
							key={actions.inCart ? 'cart-on' : 'cart-off'}
							content={actions.inCart ? 'En el carrito' : 'Agregar al carrito'}
							placement='bottom'
							classNames={{ base: 'z-[200]' }}
						>
							<Button
								isIconOnly
								aria-label={actions.inCart ? 'Producto en el carrito' : 'Agregar al carrito'}
								className='h-14 w-14 bg-white p-2 shadow-md hover:bg-gray-200'
								onPress={() => void actions.handleAddToCart()}
								isDisabled={!model.slug || model.isSoldOut}
								isLoading={actions.addingToCart}
							>
								<ShoppingCart
									className={actions.inCart ? 'text-primary' : ''}
									fill={actions.inCart ? 'currentColor' : 'none'}
								/>
							</Button>
						</Tooltip>
					</div>
				)}
			</div>

			{model.slug ? (
				<Link href={actions.productHref} className='mt-4 block text-center'>
					<h3 className='mx-auto flex w-full text-lg font-semibold text-black'>{model.title}</h3>
					<ProductPriceBlock variant='shop' price={model.price} comparePrice={model.comparePrice} />
				</Link>
			) : (
				<div className='mt-4 text-center'>
					<h3 className='mx-auto flex w-full text-lg font-semibold text-black'>{model.title}</h3>
					<ProductPriceBlock variant='shop' price={model.price} comparePrice={model.comparePrice} />
				</div>
			)}
		</div>
	);
}
