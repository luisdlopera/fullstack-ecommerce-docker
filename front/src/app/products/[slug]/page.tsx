'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Image, Chip, Spinner } from '@heroui/react';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { getClientApiUrl, type Product } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

export default function ProductDetailPage() {
	const params = useParams<{ slug: string }>();
	const router = useRouter();
	const { addItem } = useCart();

	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [selectedImage, setSelectedImage] = useState(0);
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const baseUrl = getClientApiUrl();
				const res = await fetch(`${baseUrl}/products/${params.slug}`);
				if (!res.ok) throw new Error('Not found');
				const data = (await res.json()) as Product;
				setProduct(data);
				if (data.sizes.length === 1) setSelectedSize(data.sizes[0]);
			} catch {
				setProduct(null);
			} finally {
				setLoading(false);
			}
		};
		fetchProduct();
	}, [params.slug]);

	const handleAddToCart = () => {
		if (!product || !selectedSize) return;
		const img =
			product.ProductImage.length > 0
				? product.ProductImage[0].url
				: '/img/shirt/shirt-black-1.png';

		addItem({
			productId: product.id,
			slug: product.slug,
			title: product.title,
			price: product.price,
			size: selectedSize,
			quantity,
			image: img,
		});
		setAdded(true);
		setTimeout(() => setAdded(false), 2000);
	};

	if (loading) {
		return (
			<main className='flex min-h-screen items-center justify-center'>
				<Spinner size='lg' />
			</main>
		);
	}

	if (!product) {
		return (
			<main className='mx-auto mt-32 flex w-11/12 flex-col items-center gap-4 text-black'>
				<h1 className='text-2xl font-bold'>Producto no encontrado</h1>
				<Button onPress={() => router.push('/')} color='primary'>
					Volver al inicio
				</Button>
			</main>
		);
	}

	const images = product.ProductImage.map((img) => img.url);
	if (images.length === 0) images.push('/img/shirt/shirt-black-1.png');

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-6xl pb-16 text-black'>
			<Button
				variant='light'
				onPress={() => router.back()}
				startContent={<ArrowLeft size={18} />}
				className='mb-6 text-black'
			>
				Volver
			</Button>

			<div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
				<div className='flex flex-col gap-4'>
					<div className='flex h-[480px] items-center justify-center rounded-2xl bg-gray-100'>
						<Image
							src={images[selectedImage]}
							alt={product.title}
							className='h-[460px] w-full object-contain'
						/>
					</div>
					{images.length > 1 && (
						<div className='flex gap-3'>
							{images.map((img, idx) => (
								<button
									key={idx}
									onClick={() => setSelectedImage(idx)}
									className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${idx === selectedImage ? 'border-primary' : 'border-transparent'}`}
								>
									<Image src={img} alt={`${product.title} ${idx + 1}`} className='h-full w-full object-cover' />
								</button>
							))}
						</div>
					)}
				</div>

				<div className='flex flex-col gap-5'>
					<div>
						<p className='text-sm uppercase text-gray-500'>{product.category?.name}</p>
						<h1 className='text-3xl font-bold'>{product.title}</h1>
					</div>

					<p className='text-3xl font-bold text-primary'>${product.price.toFixed(2)}</p>

					<p className='leading-relaxed text-gray-600'>{product.description}</p>

					<div>
						<p className='mb-2 font-semibold'>Talla</p>
						<div className='flex flex-wrap gap-2'>
							{product.sizes.map((size) => (
								<Chip
									key={size}
									variant={selectedSize === size ? 'solid' : 'bordered'}
									color={selectedSize === size ? 'primary' : 'default'}
									className='cursor-pointer'
									onClick={() => setSelectedSize(size)}
								>
									{size}
								</Chip>
							))}
						</div>
					</div>

					<div>
						<p className='mb-2 font-semibold'>Cantidad</p>
						<div className='flex items-center gap-3'>
							<Button isIconOnly size='sm' variant='bordered' onPress={() => setQuantity(Math.max(1, quantity - 1))}>
								<Minus size={16} />
							</Button>
							<span className='w-8 text-center text-lg font-semibold'>{quantity}</span>
							<Button
								isIconOnly
								size='sm'
								variant='bordered'
								onPress={() => setQuantity(Math.min(product.inStock, quantity + 1))}
							>
								<Plus size={16} />
							</Button>
						</div>
					</div>

					<Chip variant='flat' color={product.inStock > 0 ? 'success' : 'danger'}>
						{product.inStock > 0 ? `${product.inStock} disponibles` : 'Agotado'}
					</Chip>

					<div className='flex gap-3'>
						<Button
							color='primary'
							size='lg'
							className='flex-1 font-bold'
							startContent={<ShoppingCart size={20} />}
							isDisabled={!selectedSize || product.inStock === 0}
							onPress={handleAddToCart}
						>
							{added ? 'Agregado!' : 'Agregar al carrito'}
						</Button>
						<Button isIconOnly size='lg' variant='bordered'>
							<Heart size={20} />
						</Button>
					</div>

					<div className='mt-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600'>
						<p>
							<span className='font-semibold'>Tags:</span> {product.tags.join(', ') || 'Sin tags'}
						</p>
						<p>
							<span className='font-semibold'>Género:</span>{' '}
							{product.gender === 'men' ? 'Hombre' : product.gender === 'women' ? 'Mujer' : product.gender === 'kid' ? 'Niños' : 'Unisex'}
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
