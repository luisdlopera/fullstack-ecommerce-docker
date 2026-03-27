'use client';

import { ProductCard, similarProductToCardModel } from '@/features/product';
import type { SimilarProductCardProps } from './types';

export function SimilarProductCard({ product }: SimilarProductCardProps) {
	return <ProductCard variant='similar' model={similarProductToCardModel(product)} />;
}
