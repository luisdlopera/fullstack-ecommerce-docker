'use client';

import Link from 'next/link';
import { Button } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Grid3X3, Heart, List, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { ProductCard, favoriteItemToCardModel } from '@/features/product';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { bffFetch } from '@/lib/bff-fetch';
import { Pagination } from '@/features/collection';
import { ConfirmDialog } from '@/features/admin';
import type { FavoriteItem, FavoritesListResponse } from '@/lib/api';

const ITEMS_PER_PAGE = 8;
const VIEW_KEY = 'nexstore-favorites-view';

type ViewMode = 'grid' | 'list';

function normalizeViewMode(value: string | null): ViewMode {
	return value === 'list' ? 'list' : 'grid';
}

export default function AccountFavoritesPage() {
	const { user } = useAuth();
	const { items, removeFavorite } = useFavorites();
	const [page, setPage] = useState(1);
	const [viewMode, setViewMode] = useState<ViewMode>('grid');
	const [remoteItems, setRemoteItems] = useState<FavoriteItem[]>([]);
	const [remoteTotalPages, setRemoteTotalPages] = useState(1);
	const [remoteTotal, setRemoteTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<FavoriteItem | null>(null);
	const [removing, setRemoving] = useState(false);

	useEffect(() => {
		setViewMode(normalizeViewMode(localStorage.getItem(VIEW_KEY)));
	}, []);

	useEffect(() => {
		localStorage.setItem(VIEW_KEY, viewMode);
	}, [viewMode]);

	useEffect(() => {
		if (!user) return;
		let cancelled = false;

		const loadFavorites = async () => {
			setLoading(true);
			try {
				const response = await bffFetch(`/users/me/favorites?page=${page}&limit=${ITEMS_PER_PAGE}`);
				if (!response.ok) throw new Error('Failed to load favorites');
				const payload = (await response.json()) as FavoritesListResponse;
				if (cancelled) return;
				setRemoteItems(payload.data);
				setRemoteTotal(payload.meta.total);
				setRemoteTotalPages(Math.max(1, payload.meta.totalPages));
			} catch {
				if (cancelled) return;
				setRemoteItems([]);
				setRemoteTotal(0);
				setRemoteTotalPages(1);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void loadFavorites();

		return () => {
			cancelled = true;
		};
	}, [user, page]);

	const localTotalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

	useEffect(() => {
		if (user) {
			if (page > remoteTotalPages) setPage(remoteTotalPages);
			return;
		}
		if (page > localTotalPages) setPage(localTotalPages);
	}, [user, page, remoteTotalPages, localTotalPages]);

	const localPageItems = useMemo(() => {
		const start = (page - 1) * ITEMS_PER_PAGE;
		return items.slice(start, start + ITEMS_PER_PAGE);
	}, [items, page]);

	const currentItems = user ? remoteItems : localPageItems;
	const totalItems = user ? remoteTotal : items.length;
	const totalPages = user ? remoteTotalPages : localTotalPages;

	const handleDeleteFavorite = async () => {
		if (!deleteTarget) return;
		setRemoving(true);
		try {
			await removeFavorite(deleteTarget);
			if (user) {
				const response = await bffFetch(`/users/me/favorites?page=${page}&limit=${ITEMS_PER_PAGE}`);
				if (response.ok) {
					const payload = (await response.json()) as FavoritesListResponse;
					setRemoteItems(payload.data);
					setRemoteTotal(payload.meta.total);
					setRemoteTotalPages(Math.max(1, payload.meta.totalPages));
				}
			}
			setDeleteTarget(null);
		} finally {
			setRemoving(false);
		}
	};

	return (
		<main className='w-full text-black'>
			<header className='mb-6 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h1 className='text-3xl font-bold'>Historial de favoritos</h1>
					<p className='mt-1 text-sm text-gray-600'>Productos que guardaste para revisar después.</p>
					<p className='mt-1 text-xs text-gray-500'>Total: {totalItems}</p>
				</div>
				<div className='flex items-center gap-2 rounded-xl border border-gray-200 p-1'>
					<Button
						isIconOnly
						size='sm'
						variant={viewMode === 'grid' ? 'solid' : 'light'}
						onPress={() => setViewMode('grid')}
						aria-label='Vista de tarjetas'
					>
						<Grid3X3 size={16} />
					</Button>
					<Button
						isIconOnly
						size='sm'
						variant={viewMode === 'list' ? 'solid' : 'light'}
						onPress={() => setViewMode('list')}
						aria-label='Vista de lista'
					>
						<List size={16} />
					</Button>
				</div>
			</header>

			{!loading && totalItems === 0 && (
				<div className='flex flex-col items-center gap-4 rounded-2xl border border-gray-200 py-16'>
					<Heart size={64} className='text-gray-300' />
					<p className='text-lg text-gray-500'>No tienes productos en favoritos.</p>
					<Button as={Link} href='/' color='primary'>
						Ir al inicio
					</Button>
				</div>
			)}

			{loading && (
				<div className='rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-500'>
					Cargando favoritos...
				</div>
			)}

			{!loading && totalItems > 0 && viewMode === 'grid' && (
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{currentItems.map((item) => (
						<div key={item.slug} className='rounded-2xl border border-gray-200 p-4'>
							<ProductCard variant='shop' model={favoriteItemToCardModel(item)} showActions />
							<div className='mt-4'>
								<Button
									variant='light'
									color='danger'
									startContent={<Trash2 size={16} />}
									onPress={() => setDeleteTarget(item)}
								>
									Quitar de favoritos
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{!loading && totalItems > 0 && viewMode === 'list' && (
				<div className='space-y-3'>
					{currentItems.map((item) => (
						<div
							key={item.slug}
							className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4'
						>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100'>
									{item.image ? (
										<Image src={item.image} alt={item.title} fill className='object-cover' />
									) : null}
								</div>
								<div className='min-w-0'>
									<Link
										href={`/products/${item.slug}`}
										className='truncate text-base font-semibold hover:underline'
									>
										{item.title}
									</Link>
									<p className='text-sm text-gray-500'>{item.slug}</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<p className='text-lg font-bold'>${item.price.toFixed(2)}</p>
								<Button
									variant='light'
									color='danger'
									startContent={<Trash2 size={16} />}
									onPress={() => setDeleteTarget(item)}
								>
									Quitar
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{totalItems > 0 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

			<ConfirmDialog
				open={!!deleteTarget}
				title='Quitar de favoritos'
				description={`¿Seguro que quieres quitar "${deleteTarget?.title ?? ''}" de favoritos?`}
				confirmLabel='Quitar'
				cancelLabel='Cancelar'
				variant='danger'
				loading={removing}
				onConfirm={() => void handleDeleteFavorite()}
				onCancel={() => setDeleteTarget(null)}
			/>
		</main>
	);
}
