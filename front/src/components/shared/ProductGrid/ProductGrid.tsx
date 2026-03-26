'use client';

import { Button, Pagination, Spinner } from '@heroui/react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../ProductCard/ProductCard';
import { getClientApiUrl, type Product, type ProductListResponse } from '@/lib/api';

type ProductGridProps = {
	gender?: string;
	tag?: string;
	query?: string;
	title: string;
};

export function ProductGrid({ gender, tag, query, title }: ProductGridProps) {
	const [data, setData] = useState<ProductListResponse | null>(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const baseUrl = getClientApiUrl();
				const params = new URLSearchParams({ page: String(page), limit: '12' });
				if (gender) params.set('gender', gender);
				if (tag) params.set('tag', tag);
				if (query) params.set('query', query);
				const res = await fetch(`${baseUrl}/products?${params}`);
				if (!res.ok) throw new Error('Failed');
				const json = (await res.json()) as ProductListResponse;
				setData(json);
			} catch {
				setData(null);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, [page, gender, tag, query]);

	const getImage = (product: Product, index: number) => {
		if (product.ProductImage && product.ProductImage.length > index) {
			return product.ProductImage[index].url;
		}
		return '/img/shirt/shirt-black-1.png';
	};

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-7xl pb-16 text-black'>
			<h1 className='mb-8 text-3xl font-bold'>{title}</h1>

			{loading && (
				<div className='flex justify-center py-20'>
					<Spinner size='lg' />
				</div>
			)}

			{!loading && (!data || data.data.length === 0) && (
				<div className='flex flex-col items-center gap-4 py-20'>
					<p className='text-lg text-gray-500'>No se encontraron productos.</p>
					<Button color='primary' onPress={() => setPage(1)}>
						Volver al inicio
					</Button>
				</div>
			)}

			{!loading && data && data.data.length > 0 && (
				<>
					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{data.data.map((product) => (
							<ProductCard
								key={product.id}
								id={product.id}
								name={product.title}
								price={product.price}
								image={getImage(product, 0)}
								image2={getImage(product, 1)}
								slug={product.slug}
								isNew
							/>
						))}
					</div>

					{data.meta.totalPages > 1 && (
						<div className='mt-10 flex justify-center'>
							<Pagination
								total={data.meta.totalPages}
								page={page}
								onChange={setPage}
								color='primary'
								showControls
							/>
						</div>
					)}
				</>
			)}
		</main>
	);
}
