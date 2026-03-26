'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, ShoppingCart } from 'lucide-react';
import type { ProductDetail } from '@/types/product-detail';
import { formatCOP } from '@/lib/format-currency';
import { ColorSelector } from './ColorSelector';
import { ProductBenefits } from './ProductBenefits';
import { QuantitySelector } from './QuantitySelector';
import { SizeSelector } from './SizeSelector';

type ProductInfoProps = {
	product: ProductDetail;
	selectedSize: string | null;
	onSizeChange: (size: string) => void;
	selectedColorId: string | null;
	onColorChange: (colorId: string) => void;
	quantity: number;
	onQuantityChange: (n: number) => void;
	onAddToCart: () => void;
	onBuyNow: () => void;
	onToggleFavorite: () => void;
	isFavorite: boolean;
	addToCartLabel?: string;
	disabledAdd?: boolean;
	disabledBuy?: boolean;
	outOfStock?: boolean;
	className?: string;
};

export function ProductInfo({
	product,
	selectedSize,
	onSizeChange,
	selectedColorId,
	onColorChange,
	quantity,
	onQuantityChange,
	onAddToCart,
	onBuyNow,
	onToggleFavorite,
	isFavorite,
	addToCartLabel = 'Agregar al carrito',
	disabledAdd,
	disabledBuy,
	outOfStock,
	className,
}: ProductInfoProps) {
	const maxQty = Math.max(1, product.inStock);
	const stockBlocked = outOfStock || product.inStock <= 0;

	return (
		<div
			className={`flex h-full max-h-[640px] flex-col overflow-y-auto overscroll-contain lg:max-h-[640px] ${className ?? ''}`}
		>
			<div className='min-h-0 flex-1'>
				<p className='text-xs text-neutral-500'>
					Ref: <span className='font-medium text-neutral-700'>{product.reference}</span>
				</p>
				<h1 className='mt-1 text-2xl font-semibold leading-tight tracking-tight text-neutral-900 md:text-3xl'>
					{product.name}
				</h1>
				<p className='mt-2 text-2xl font-medium tabular-nums text-neutral-900 md:text-3xl'>
					{formatCOP(product.price)}
				</p>

				{stockBlocked && <p className='mt-2 text-sm font-medium text-red-600'>Producto agotado</p>}

				<div className='mt-4 grid gap-4 border-t border-neutral-100 pt-4 md:grid-cols-2 md:gap-5'>
					<SizeSelector
						sizes={product.sizes}
						value={selectedSize}
						onChange={onSizeChange}
						disabled={stockBlocked}
					/>
					<ColorSelector
						colors={product.colors}
						value={selectedColorId}
						onChange={onColorChange}
						disabled={stockBlocked}
					/>
				</div>

				{product.sizeGuideHref && (
					<Link
						href={product.sizeGuideHref}
						className='mt-2 inline-flex text-xs font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-900 md:text-sm'
					>
						Guía de tallas
					</Link>
				)}

				<div className='mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
					<QuantitySelector
						value={quantity}
						max={maxQty}
						onChange={onQuantityChange}
						disabled={stockBlocked}
					/>
					<button
						type='button'
						onClick={onToggleFavorite}
						className='flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50'
					>
						<Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
						{isFavorite ? 'En favoritos' : 'Favoritos'}
					</button>
				</div>

				<div className='mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3'>
					<button
						type='button'
						onClick={onAddToCart}
						disabled={disabledAdd || stockBlocked || !selectedSize}
						className='flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40'
					>
						<ShoppingCart className='h-4 w-4' />
						{addToCartLabel}
					</button>
					<button
						type='button'
						onClick={onBuyNow}
						disabled={disabledBuy || stockBlocked || !selectedSize}
						className='flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40'
					>
						<ShoppingBag className='h-4 w-4' />
						Comprar ahora
					</button>
				</div>
			</div>

			<div className='mt-4 shrink-0 border-t border-neutral-100 pt-4'>
				<ProductBenefits items={product.benefits} compact />
			</div>
		</div>
	);
}
