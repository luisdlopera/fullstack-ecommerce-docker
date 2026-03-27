'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
	const [items, setItems] = useState<FavoriteItem[]>([]);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		queueMicrotask(() => {
			setItems(loadFavorites());
			setHydrated(true);
		});
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		saveFavorites(items);
	}, [items, hydrated]);

	const isFavorite = useCallback((slug: string) => items.some((item) => item.slug === slug), [items]);

	const toggleFavorite = useCallback((item: FavoriteItem) => {
		setItems((prev) => {
			const exists = prev.some((fav) => fav.slug === item.slug);
			if (exists) {
				return prev.filter((fav) => fav.slug !== item.slug);
			}
			return [item, ...prev];
		});
	}, []);

	const value = useMemo(() => ({ items, isFavorite, toggleFavorite }), [items, isFavorite, toggleFavorite]);

	return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
	const ctx = useContext(FavoritesContext);
	if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
	return ctx;
}
