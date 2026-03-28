'use client';

import { Button, Pagination, Spinner } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { ProductCard, apiProductToCardModel } from '@/features/product';
import { fetchProductsClient, type ProductListResponse } from '@/lib/api';

export type FetchedProductGridProps = {
	gender?: string;
	tag?: string;
	query?: string;
	title: string;
	embedded?: boolean;
	page?: number;
	onPageChange?: (page: number) => void;
};

export function FetchedProductGrid({
	gender,
	tag,
	query,
	title,
	embedded = false,
	page: pageProp,
	onPageChange,
}: FetchedProductGridProps) {
	const [data, setData] = useState<ProductListResponse | null>(null);
	const [internalPage, setInternalPage] = useState(1);
	const controlled = onPageChange != null;
	const page = controlled ? Math.max(1, pageProp ?? 1) : internalPage;
	const setPage = controlled ? onPageChange : setInternalPage;

	const [loading, setLoading] = useState(true);
	const filterKey = `${query ?? ''}|${gender ?? ''}|${tag ?? ''}`;
	const prevFilterKey = useRef<string | null>(null);

	useEffect(() => {
		if (prevFilterKey.current === null) {
			prevFilterKey.current = filterKey;
			return;
		}
		if (prevFilterKey.current !== filterKey) {
			prevFilterKey.current = filterKey;
			setPage(1);
		}
	}, [filterKey, setPage]);

	useEffect(() => {
		const run = async () => {
			setLoading(true);
			try {
				const json = await fetchProductsClient({
					page,
					limit: 12,
					...(gender ? { gender } : {}),
					...(tag ? { tag } : {}),
					...(query ? { query } : {}),
				});
				setData(json);
			} catch {
				setData(null);
			} finally {
				setLoading(false);
			}
		};
		void run();
	}, [page, gender, tag, query]);

	const wrapperClass = embedded ? 'w-full text-black' : 'mx-auto mt-28 w-[90%] max-w-480 pb-16 text-black';

	const Root = embedded ? 'section' : 'main';
	const Heading = embedded ? 'h2' : 'h1';

	return (
		<Root className={wrapperClass}>
			<Heading className='mb-8 text-3xl font-bold'>{title}</Heading>

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
								variant='shop'
								model={apiProductToCardModel(product)}
								showActions
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
		</Root>
	);
}
