'use client';

import Link from 'next/link';
import { Button } from '@heroui/react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { ProductCard, favoriteItemToCardModel } from '@/features/product';

export default function FavoritesPage() {
	const { items } = useFavorites();

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-7xl pb-16 text-black'>
			<h1 className='mb-8 text-3xl font-bold'>Mis Favoritos</h1>

			{items.length === 0 && (
				<div className='flex flex-col items-center gap-4 py-20'>
					<Heart size={64} className='text-gray-300' />
					<p className='text-lg text-gray-500'>No tienes productos en favoritos.</p>
					<Button as={Link} href='/' color='primary'>
						Ir al inicio
					</Button>
				</div>
			)}

			{items.length > 0 && (
				<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					{items.map((item) => (
						<ProductCard
							key={item.slug}
							variant='shop'
							model={favoriteItemToCardModel(item)}
							showActions
						/>
					))}
				</div>
			)}
		</main>
	);
}
