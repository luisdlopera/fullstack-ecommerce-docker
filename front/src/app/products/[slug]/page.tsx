'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import {
	ProductAccordion,
	ProductGallery,
	ProductInfo,
	SimilarProductsSection,
} from '@/components/product-detail';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { mapApiProductToProductDetail, mapProductToSimilarProduct } from '@/lib/adapters/product-detail';
import { fetchProductsClient, getClientApiUrl } from '@/lib/api';
import { getMockProductDetail } from '@/lib/mocks/product-detail';
import { pickDefaultSize } from '@/lib/product-size';
import type { Product } from '@/lib/api';
import type { ProductAccordionItem, ProductDetail, SimilarProduct } from '@/types/product-detail';

/** Set `NEXT_PUBLIC_PRODUCT_DETAIL_USE_MOCK=true` to use local mock PDP data (no API). */
const USE_PRODUCT_DETAIL_MOCK = process.env.NEXT_PUBLIC_PRODUCT_DETAIL_USE_MOCK === 'true';

function defaultColorId(colors: ProductDetail['colors']): string | null {
	if (colors.length === 0) return null;
	const black = colors.find((c) => c.id === 'black');
	return black?.id ?? colors[0].id;
}

export default function ProductDetailPage() {
	const params = useParams<{ slug: string }>();
	const router = useRouter();
	const { addItem } = useCart();
	const { isFavorite, toggleFavorite } = useFavorites();

	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [relatedProducts, setRelatedProducts] = useState<SimilarProduct[]>([]);
	const [loading, setLoading] = useState(!USE_PRODUCT_DETAIL_MOCK);
	const [selectedImage, setSelectedImage] = useState(0);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [addFeedback, setAddFeedback] = useState(false);

	useEffect(() => {
		if (USE_PRODUCT_DETAIL_MOCK) {
			const p = getMockProductDetail(params.slug);
			setProduct(p);
			setSelectedSize(pickDefaultSize(p.sizes));
			setSelectedColorId(defaultColorId(p.colors));
			setLoading(false);
			return;
		}

		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const res = await fetch(`${getClientApiUrl()}/products/${params.slug}`);
				if (res.ok) {
					const data = (await res.json()) as Product;
					const p = mapApiProductToProductDetail(data);
					if (!cancelled) {
						setProduct(p);
						setSelectedSize(
							data.sizes.length === 1 ? data.sizes[0] : pickDefaultSize(p.sizes),
						);
						setSelectedColorId(defaultColorId(p.colors));
						setSelectedImage(0);
						setQuantity(1);
					}
				} else if (!cancelled) {
					setProduct(null);
				}
			} catch {
				if (!cancelled) setProduct(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [params.slug]);

	useEffect(() => {
		if (!product) {
			setRelatedProducts([]);
			return;
		}
		if (product.similarProducts.length > 0) {
			setRelatedProducts(product.similarProducts);
			return;
		}
		const gender = product.gender;
		if (!gender) {
			setRelatedProducts([]);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const body = await fetchProductsClient({ gender, limit: 12 });
				if (cancelled) return;
				const list = body.data ?? [];
				const filtered = list.filter((p) => p.slug !== product.slug).slice(0, 4);
				if (!cancelled) setRelatedProducts(filtered.map(mapProductToSimilarProduct));
			} catch {
				if (!cancelled) setRelatedProducts([]);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [product]);

	const accordionItems: ProductAccordionItem[] = useMemo(() => {
		if (!product) return [];
		return [
			{ id: 'desc', title: 'Descripción', content: product.description },
			{ id: 'rec', title: 'Recomendaciones', content: product.recommendations },
		];
	}, [product]);

	const favorite = product ? isFavorite(product.slug) : false;

	const handleToggleFavorite = () => {
		if (!product) return;
		const img = product.images[0] ?? '/img/shirt/shirt-black-1.png';
		toggleFavorite({
			productId: product.id,
			slug: product.slug,
			title: product.name,
			price: product.price,
			image: img,
		});
	};

	const pushCartItem = () => {
		if (!product || !selectedSize) return;
		const img = product.images[selectedImage] ?? product.images[0] ?? '/img/shirt/shirt-black-1.png';
		addItem({
			productId: product.id,
			slug: product.slug,
			title: product.name,
			price: product.price,
			size: selectedSize,
			quantity,
			image: img,
		});
	};

	const handleAddToCart = () => {
		pushCartItem();
		setAddFeedback(true);
		window.setTimeout(() => setAddFeedback(false), 2000);
	};

	const handleBuyNow = () => {
		pushCartItem();
		router.push('/checkout');
	};

	if (loading) {
		return (
			<main className='flex min-h-screen items-center justify-center bg-neutral-50'>
				<Spinner size='lg' color='primary' />
			</main>
		);
	}

	if (!product) {
		return (
			<main className='mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-4 bg-neutral-50 px-4 pt-28 text-neutral-900'>
				<h1 className='text-2xl font-semibold'>Producto no encontrado</h1>
				<Button color='primary' onPress={() => router.push('/')}>
					Volver al inicio
				</Button>
			</main>
		);
	}

	return (
		<div className='min-h-screen bg-neutral-50 text-neutral-900'>
			<main className='mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:px-10'>
				<section className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:items-stretch lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]'>
					<ProductGallery
						className='lg:h-[640px]'
						images={product.images}
						selectedIndex={selectedImage}
						onSelectIndex={setSelectedImage}
						productName={product.name}
						isNew={product.isNew}
						isFavorite={favorite}
						onToggleFavorite={handleToggleFavorite}
					/>

					<div className='flex min-h-0 flex-col lg:h-[640px]'>
						<ProductInfo
							product={product}
							selectedSize={selectedSize}
							onSizeChange={setSelectedSize}
							selectedColorId={selectedColorId}
							onColorChange={setSelectedColorId}
							quantity={quantity}
							onQuantityChange={setQuantity}
							onAddToCart={handleAddToCart}
							onBuyNow={handleBuyNow}
							onToggleFavorite={handleToggleFavorite}
							isFavorite={favorite}
							addToCartLabel={addFeedback ? '¡Agregado!' : 'Agregar al carrito'}
							outOfStock={product.inStock <= 0}
						/>
					</div>
				</section>

				<section id='guia-tallas' className='mt-12 scroll-mt-28'>
					<ProductAccordion items={accordionItems} />
				</section>

				<SimilarProductsSection products={relatedProducts} />
			</main>
		</div>
	);
}
