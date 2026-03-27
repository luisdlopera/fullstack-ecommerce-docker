import type { Product, FeaturedProduct } from '@/lib/api';
import { discountPercent, isNewFromTags } from '@/lib/product-flags';
import type { CatalogProduct } from '../../collection/types';
import type { SimilarProduct } from '@/features/product-detail/types';
import type { FavoriteItem } from '@/contexts/FavoritesContext';
import type { ProductCardViewModel } from '../types/product-card-model';

export function catalogProductToCardModel(p: CatalogProduct): ProductCardViewModel {
	return {
		id: p.id,
		slug: p.slug,
		title: p.name,
		price: p.price,
		comparePrice: p.comparePrice,
		image: p.image,
		image2: p.image2,
		sizes: p.sizes,
		isNew: p.isNew,
		discountPercent: p.discountPercent,
		isSoldOut: p.isSoldOut,
	};
}

export function apiProductToCardModel(p: Product): ProductCardViewModel {
	const imgs = p.ProductImage ?? [];
	return {
		id: p.id,
		slug: p.slug,
		title: p.title,
		price: p.price,
		comparePrice: p.comparePrice,
		image: imgs[0]?.url ?? '/img/shirt/shirt-black-1.png',
		image2: imgs[1]?.url,
		sizes: p.sizes,
		isNew: isNewFromTags(p.tags),
		discountPercent: discountPercent(p.price, p.comparePrice),
		isSoldOut: p.inStock <= 0,
	};
}

export function featuredProductToCardModel(p: FeaturedProduct): ProductCardViewModel {
	const imgs = p.images ?? [];
	return {
		id: p.id,
		slug: p.slug,
		title: p.title,
		price: p.price,
		image: imgs[0] || '/img/shirt/shirt-black-1.png',
		image2: imgs[1] || imgs[0] || '/img/shirt/shirt-black-2.png',
		isNew: isNewFromTags(p.tags),
		discountPercent: 0,
		isSoldOut: false,
	};
}

export function similarProductToCardModel(p: SimilarProduct): ProductCardViewModel {
	return {
		id: p.id,
		slug: p.slug,
		title: p.name,
		price: p.price,
		image: p.image,
		isNew: false,
		discountPercent: 0,
		isSoldOut: p.isSoldOut ?? false,
		highlightBadge: p.badge,
		discountBadge: p.discountLabel,
	};
}

export function favoriteItemToCardModel(item: FavoriteItem): ProductCardViewModel {
	return {
		id: item.productId,
		slug: item.slug,
		title: item.title,
		price: item.price,
		image: item.image,
		image2: item.image,
		isNew: false,
		discountPercent: 0,
		isSoldOut: false,
	};
}
