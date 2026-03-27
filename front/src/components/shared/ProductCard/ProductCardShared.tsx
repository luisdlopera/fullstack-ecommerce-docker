'use client';

import { ProductCard, type ProductCardViewModel } from '@/features/product';

/** @deprecated Prefer `ProductCard` + mappers from `@/features/product`. */
export interface ProductCardSharedProps {
	id?: string;
	name: string;
	price: number;
	comparePrice?: number | null;
	image: string;
	image2?: string;
	slug?: string;
	sizes?: string[];
	isNew?: boolean;
	discount?: number;
	isSoldOut?: boolean;
}

function propsToModel(p: ProductCardSharedProps): ProductCardViewModel {
	return {
		id: p.id ?? p.slug ?? '',
		slug: p.slug ?? '',
		title: p.name,
		price: p.price,
		comparePrice: p.comparePrice,
		image: p.image,
		image2: p.image2,
		sizes: p.sizes,
		isNew: p.isNew ?? false,
		discountPercent: p.discount ?? 0,
		isSoldOut: p.isSoldOut ?? false,
	};
}

export function ProductCardShared(props: ProductCardSharedProps) {
	return <ProductCard variant='shop' model={propsToModel(props)} showActions />;
}
