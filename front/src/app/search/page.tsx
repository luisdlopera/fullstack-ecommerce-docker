'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Spinner } from '@heroui/react';
import { Search } from 'lucide-react';
import { FetchedProductGrid } from '@/components/shared/ProductGrid';

function SearchContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentQuery = searchParams.get('q') ?? '';
	const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
	const [query, setQuery] = useState(currentQuery);

	useEffect(() => {
		setQuery(currentQuery);
	}, [currentQuery]);

	const setPage = useCallback(
		(p: number) => {
			const sp = new URLSearchParams();
			if (currentQuery) sp.set('q', currentQuery);
			if (p > 1) sp.set('page', String(p));
			const qs = sp.toString();
			router.push(qs ? `/search?${qs}` : '/search');
		},
		[currentQuery, router],
	);

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const q = query.trim();
		const sp = new URLSearchParams();
		if (q) sp.set('q', q);
		const qs = sp.toString();
		router.push(qs ? `/search?${qs}` : '/search');
	};

	return (
		<main className='mx-auto mt-28 w-[90%] max-w-480 pb-16 text-black'>
			<h1 className='mb-6 text-3xl font-bold'>Buscar productos</h1>
			<form onSubmit={onSubmit} className='mb-8 flex gap-3'>
				<Input
					value={query}
					onValueChange={setQuery}
					placeholder='Busca por nombre de producto'
					startContent={<Search size={18} />}
					className='max-w-xl'
				/>
				<Button type='submit' color='primary' className='font-semibold'>
					Buscar
				</Button>
			</form>

			<FetchedProductGrid
				embedded
				title={currentQuery ? `Resultados para "${currentQuery}"` : 'Todos los productos'}
				query={currentQuery || undefined}
				page={page}
				onPageChange={setPage}
			/>
		</main>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen items-center justify-center'>
					<Spinner size='lg' />
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
