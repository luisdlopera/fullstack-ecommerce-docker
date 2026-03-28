'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { ProductAccordion } from './components/ProductAccordion';
import { ProductDetailSkeleton } from './components/ProductDetailSkeleton';
import { ProductGallery } from './components/ProductGallery';
import { ProductInfo } from './components/ProductInfo';
import { SimilarProductsSection } from './components/SimilarProductsSection';
import { mapApiProductToProductDetail, mapProductToSimilarProduct } from './lib/product-detail-adapter';
import type { ProductAccordionItem, ProductDetail, SimilarProduct } from './types';
import { useCart } from '@/features/cart';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Product } from '@/lib/api';
import { fetchProductsClient } from '@/lib/api';
import { fetchProductBySlugClient } from '@/lib/shop-api';
import { getMockProductDetail } from '@/lib/mocks/product-detail';
import { pickDefaultSize } from '@/lib/product-size';

export type ProductDetailPageClientProps = {
	slug: string;
	initialApiProduct: Product | null;
	useMock: boolean;
};

function defaultColorId(colors: ProductDetail['colors']): string | null {
	if (colors.length === 0) return null;
	const black = colors.find((c) => c.id === 'black');
	return black?.id ?? colors[0].id;
}

function selectionFromApi(p: Product): { size: string | null; color: string | null } {
	const detail = mapApiProductToProductDetail(p);
	const size = p.sizes.length === 1 ? p.sizes[0] : pickDefaultSize(detail.sizes);
	return { size, color: defaultColorId(detail.colors) };
}

export function ProductDetailPageClient({ slug, initialApiProduct, useMock }: ProductDetailPageClientProps) {
	const params = useParams<{ slug: string }>();
	const router = useRouter();
	const { addItem } = useCart();
	const { isFavorite, toggleFavorite } = useFavorites();

	const initialSelection =
		initialApiProduct && !useMock ? selectionFromApi(initialApiProduct) : { size: null as string | null, color: null as string | null };

	const [product, setProduct] = useState<ProductDetail | null>(() =>
		initialApiProduct ? mapApiProductToProductDetail(initialApiProduct) : null,
	);
	const [relatedProducts, setRelatedProducts] = useState<SimilarProduct[]>([]);
	const [loading, setLoading] = useState(() => Boolean(useMock || !initialApiProduct));
	const [selectedImage, setSelectedImage] = useState(0);
	const [selectedSize, setSelectedSize] = useState<string | null>(() => initialSelection.size);
	const [selectedColorId, setSelectedColorId] = useState<string | null>(() => initialSelection.color);
	const [quantity, setQuantity] = useState(1);
	const [addFeedback, setAddFeedback] = useState(false);

	useEffect(() => {
		if (useMock) {
			const p = getMockProductDetail(params.slug);
			setProduct(p);
			setSelectedSize(pickDefaultSize(p.sizes));
			setSelectedColorId(defaultColorId(p.colors));
			setLoading(false);
			return;
		}

		if (initialApiProduct && params.slug === slug) {
			const p = mapApiProductToProductDetail(initialApiProduct);
			setProduct(p);
			setSelectedSize(initialApiProduct.sizes.length === 1 ? initialApiProduct.sizes[0] : pickDefaultSize(p.sizes));
			setSelectedColorId(defaultColorId(p.colors));
			setSelectedImage(0);
			setQuantity(1);
			setLoading(false);
			return;
		}

		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const data = await fetchProductBySlugClient(params.slug);
				if (data && !cancelled) {
					const p = mapApiProductToProductDetail(data);
					setProduct(p);
					setSelectedSize(data.sizes.length === 1 ? data.sizes[0] : pickDefaultSize(p.sizes));
					setSelectedColorId(defaultColorId(p.colors));
					setSelectedImage(0);
					setQuantity(1);
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
	}, [params.slug, slug, initialApiProduct, useMock]);

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
				const filtered = list.filter((p) => p.slug !== product.slug).slice(0, 12);
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
		return <ProductDetailSkeleton />;
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
			<main className='mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-8 lg:px-10'>
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
