import type { Product, FeaturedProduct } from '@/lib/api';
import { discountPercent, isNewFromTags } from '@/lib/product-flags';
import { getProductImageUrl } from '@/lib/assets';
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
		image: imgs[0] ? getProductImageUrl(imgs[0]) : '/img/shirt/shirt-black-1.png',
		image2: imgs[1] ? getProductImageUrl(imgs[1]) : undefined,
		sizes: p.sizes,
		isNew: isNewFromTags(p.tags),
		discountPercent: discountPercent(p.price, p.comparePrice),
		isSoldOut: p.inStock <= 0,
	};
}

export function featuredProductToCardModel(p: FeaturedProduct): ProductCardViewModel {
	const imgs = p.images ?? [];

	// Helper to ensure image URL is complete
	const resolveImageUrl = (url: string | undefined): string => {
		if (!url) return '/img/placeholder-product.png';
		// If it's already a full URL (http/https), use it directly
		if (url.startsWith('http')) return url;
		// If it's a relative path, we need to construct the full URL
		// This handles the case where the API returns storageKey or partial paths
		const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
		if (baseUrl) {
			const normalizedPath = url.replace(/^\/+/g, '');
			return `${baseUrl.replace(/\/$/g, '')}/${normalizedPath}`;
		}
		return url;
	};

	const image1 = resolveImageUrl(imgs[0]);
	const image2 = resolveImageUrl(imgs[1]) || image1;

	return {
		id: p.id,
		slug: p.slug,
		title: p.title,
		price: p.price,
		image: image1,
		image2: image2,
		isNew: isNewFromTags(p.tags),
		discountPercent: 0,
		isSoldOut: false,
	};
}

export function similarProductToCardModel(p: SimilarProduct): ProductCardViewModel {
	// Helper to ensure image URL is complete
	const resolveImageUrl = (url: string | undefined): string => {
		if (!url) return '/img/placeholder-product.png';
		if (url.startsWith('http')) return url;
		const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
		if (baseUrl) {
			const normalizedPath = url.replace(/^\/+/g, '');
			return `${baseUrl.replace(/\/$/g, '')}/${normalizedPath}`;
		}
		return url;
	};

	const resolvedImage = resolveImageUrl(p.image);

	return {
		id: p.id,
		slug: p.slug,
		title: p.name,
		price: p.price,
		image: resolvedImage,
		isNew: false,
		discountPercent: 0,
		isSoldOut: p.isSoldOut ?? false,
		highlightBadge: p.badge,
		discountBadge: p.discountLabel,
	};
}

export function favoriteItemToCardModel(item: FavoriteItem): ProductCardViewModel {
	// Build proper image data object for getProductImageUrl
	const imageData = {
		url: item.image,
		storageKey: item.imageStorageKey,
		storageProvider: item.imageStorageProvider,
	};

	const resolvedImage = getProductImageUrl(imageData);

	return {
		id: item.productId,
		slug: item.slug,
		title: item.title,
		price: item.price,
		image: resolvedImage,
		image2: resolvedImage,
		isNew: false,
		discountPercent: 0,
		isSoldOut: false,
	};
}
