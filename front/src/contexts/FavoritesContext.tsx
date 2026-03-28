'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { bffFetch } from '@/lib/bff-fetch';

export type FavoriteItem = {
	productId: string;
	slug: string;
	title: string;
	price: number;
	image: string;
};

type FavoritesContextType = {
	items: FavoriteItem[];
	isFavorite: (slug: string) => boolean;
	toggleFavorite: (item: FavoriteItem) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const STORAGE_KEY = 'nexstore-favorites';

function loadFavorites(): FavoriteItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
	} catch {
		return [];
	}
}

function saveFavorites(items: FavoriteItem[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const [items, setItems] = useState<FavoriteItem[]>([]);
	const [hydrated, setHydrated] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

	useEffect(() => {
		queueMicrotask(() => {
			setItems(loadFavorites());
			setHydrated(true);
		});
	}, []);

	useEffect(() => {
		if (!hydrated || user) return;
		saveFavorites(items);
	}, [items, hydrated, user]);

	useEffect(() => {
		if (!hydrated || !user || syncing || syncedUserId === user.id) return;

		const syncWithServer = async () => {
			setSyncing(true);
			const localSnapshot = loadFavorites();
			try {
				if (localSnapshot.length > 0) {
					await Promise.all(
						localSnapshot.map((item) =>
							bffFetch('/users/me/favorites', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ productId: item.productId }),
							}).catch(() => null),
						),
					);
				}

				const res = await bffFetch('/users/me/favorites');
				if (res.ok) {
					setItems((await res.json()) as FavoriteItem[]);
					saveFavorites([]);
					setSyncedUserId(user.id);
				}
			} catch {
				setItems(localSnapshot);
			} finally {
				setSyncedUserId(user.id);
				setSyncing(false);
			}
		};

		void syncWithServer();
	}, [hydrated, user, syncing, syncedUserId]);

	useEffect(() => {
		if (!user) {
			setSyncedUserId(null);
		}
	}, [user]);

	const isFavorite = useCallback((slug: string) => items.some((item) => item.slug === slug), [items]);

	const toggleFavorite = useCallback(
		(item: FavoriteItem) => {
			if (user) {
				setItems((prev) => {
					const existing = prev.find((fav) => fav.slug === item.slug);
					if (existing) {
						void bffFetch(`/users/me/favorites/${existing.productId}`, { method: 'DELETE' });
						return prev.filter((fav) => fav.slug !== item.slug);
					}
					void bffFetch('/users/me/favorites', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ productId: item.productId }),
					});
					return [item, ...prev];
				});
				return;
			}

			setItems((prev) => {
				const exists = prev.some((fav) => fav.slug === item.slug);
				if (exists) {
					return prev.filter((fav) => fav.slug !== item.slug);
				}
				return [item, ...prev];
			});
		},
		[user],
	);

	const value = useMemo(() => ({ items, isFavorite, toggleFavorite }), [items, isFavorite, toggleFavorite]);

	return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
	const ctx = useContext(FavoritesContext);
	if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
	return ctx;
}
