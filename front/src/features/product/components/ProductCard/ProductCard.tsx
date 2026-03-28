'use client';

import type { ProductCardViewModel } from '../../types/product-card-model';
import { ProductCardGrid } from './ProductCardGrid';
import { ProductCardShop } from './ProductCardShop';

export type ProductCardVariant = 'grid' | 'shop';

export type ProductCardProps = {
	variant: ProductCardVariant;
	model: ProductCardViewModel;
	/** Solo variante `shop`: muestra favoritos / carrito al hover. */
	showActions?: boolean;
};

export function ProductCard({ variant, model, showActions }: ProductCardProps) {
	if (variant === 'grid') return <ProductCardGrid model={model} />;
	return <ProductCardShop model={model} showActions={showActions} />;
}
