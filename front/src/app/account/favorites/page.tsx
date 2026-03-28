'use client';

import Link from 'next/link';
import { Button } from '@heroui/react';
import { Heart, Trash2 } from 'lucide-react';
import { ProductCard, favoriteItemToCardModel } from '@/features/product';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function AccountFavoritesPage() {
	const { items, toggleFavorite } = useFavorites();

	return (
		<main className='w-full text-black'>
			<header className='mb-6'>
				<h1 className='text-3xl font-bold'>Historial de favoritos</h1>
				<p className='mt-1 text-sm text-gray-600'>Productos que guardaste para revisar después.</p>
			</header>

			{items.length === 0 && (
				<div className='flex flex-col items-center gap-4 rounded-2xl border border-gray-200 py-16'>
					<Heart size={64} className='text-gray-300' />
					<p className='text-lg text-gray-500'>No tienes productos en favoritos.</p>
					<Button as={Link} href='/' color='primary'>
						Ir al inicio
					</Button>
				</div>
			)}

			{items.length > 0 && (
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{items.map((item) => (
						<div key={item.slug} className='rounded-2xl border border-gray-200 p-4'>
							<ProductCard variant='shop' model={favoriteItemToCardModel(item)} showActions />
							<div className='mt-4'>
								<Button
									variant='light'
									color='danger'
									startContent={<Trash2 size={16} />}
									onPress={() => toggleFavorite(item)}
								>
									Quitar de favoritos
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</main>
	);
}
