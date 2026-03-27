'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/features/cart';
import type { Product } from '@/lib/api';
import { pickDefaultSize } from '@/lib/product-size';
import { fetchProductBySlugClient } from '@/lib/shop-api';
import type { ProductCardViewModel } from '../types/product-card-model';

export function useProductCardActions(
	model: Pick<ProductCardViewModel, 'id' | 'slug' | 'title' | 'price' | 'image' | 'sizes' | 'isSoldOut'>,
	options: { favorites?: boolean; cart?: boolean } = {},
) {
	const { favorites = true, cart: cartEnabled = true } = options;
	const [addingToCart, setAddingToCart] = useState(false);
	const router = useRouter();
	const { isFavorite, toggleFavorite } = useFavorites();
	const { addItem, items: cartItems } = useCart();

	const slug = model.slug;
	const favorite = slug ? isFavorite(slug) : false;
	const inCart = slug ? cartItems.some((i) => i.slug === slug) : false;
	const productHref = slug ? `/products/${slug}` : '#';

	const handleToggleFavorite = useCallback(() => {
		if (!slug || !favorites) return;
		toggleFavorite({
			productId: model.id,
			slug,
			title: model.title,
			price: model.price,
			image: model.image,
		});
	}, [favorites, slug, model.id, model.title, model.price, model.image, toggleFavorite]);

	const pushLineFromProduct = useCallback(
		(product: Product, img: string) => {
			if (product.inStock === 0 || product.sizes.length === 0) return;
			const defaultSize = pickDefaultSize(product.sizes);
			if (!defaultSize) return;
			addItem({
				productId: product.id,
				slug: product.slug,
				title: product.title,
				price: product.price,
				size: defaultSize,
				quantity: 1,
				image: img,
			});
		},
		[addItem],
	);

	const handleAddToCart = useCallback(async () => {
		if (!slug || model.isSoldOut || !cartEnabled) return;
		const { sizes, image } = model;
		if (sizes && sizes.length > 0) {
			setAddingToCart(true);
			try {
				const defaultSize = pickDefaultSize(sizes);
				if (!defaultSize) return;
				addItem({
					productId: model.id,
					slug,
					title: model.title,
					price: model.price,
					size: defaultSize,
					quantity: 1,
					image,
				});
			} finally {
				setAddingToCart(false);
			}
			return;
		}
		setAddingToCart(true);
		try {
			const product = await fetchProductBySlugClient(slug);
			if (!product) {
				router.push(productHref);
				return;
			}
			const img = product.ProductImage.length > 0 ? product.ProductImage[0].url : image;
			pushLineFromProduct(product, img);
		} finally {
			setAddingToCart(false);
		}
	}, [slug, model, cartEnabled, addItem, router, productHref, pushLineFromProduct]);

	return {
		favorite,
		inCart,
		addingToCart,
		productHref,
		handleToggleFavorite,
		handleAddToCart,
	};
}
