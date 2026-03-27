'use client';

import { ProductCard, catalogProductToCardModel } from '@/features/product';
import type { CatalogProductCardProps } from './types';

export function CatalogProductCard({ product }: CatalogProductCardProps) {
	return <ProductCard variant='grid' model={catalogProductToCardModel(product)} />;
}
