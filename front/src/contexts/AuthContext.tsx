'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shopFetch } from '@/lib/shop-api';

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role: string;
};

type AuthContextType = {
	user: AuthUser | null;
	token: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'nexstore-token';
const REFRESH_KEY = 'nexstore-refresh';
const USER_KEY = 'nexstore-user';

function nestErrorMessage(body: unknown, fallback: string): string {
	if (!body || typeof body !== 'object') return fallback;
	const msg = (body as { message?: unknown }).message;
	if (typeof msg === 'string') return msg;
	if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) return msg.join('. ');
	return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		queueMicrotask(() => {
			const storedUser = localStorage.getItem(USER_KEY);
			if (storedUser) {
				try {
					setUser(JSON.parse(storedUser) as AuthUser);
				} catch {
					/* ignore */
				}
			}
			setToken(localStorage.getItem(TOKEN_KEY));
			setLoading(false);
		});
	}, []);

	const persistAuth = useCallback((authUser: AuthUser, accessToken: string, refreshToken: string) => {
		setUser(authUser);
		setToken(accessToken);
		localStorage.setItem(TOKEN_KEY, accessToken);
		localStorage.setItem(REFRESH_KEY, refreshToken);
		localStorage.setItem(USER_KEY, JSON.stringify(authUser));
	}, []);

	const login = useCallback(
		async (email: string, password: string) => {
			const res = await shopFetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), password }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(nestErrorMessage(body, 'Error al iniciar sesión'));
			}

			const data = (await res.json()) as {
				user: AuthUser;
				accessToken: string;
				refreshToken: string;
			};

			persistAuth(data.user, data.accessToken, data.refreshToken);
		},
		[persistAuth],
	);

	const register = useCallback(
		async (name: string, email: string, password: string) => {
			const res = await shopFetch('/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(nestErrorMessage(body, 'Error al registrarse'));
			}

			const data = (await res.json()) as {
				user: AuthUser;
				accessToken: string;
				refreshToken: string;
			};

			persistAuth(data.user, data.accessToken, data.refreshToken);
		},
		[persistAuth],
	);

	const logout = useCallback(async () => {
		const currentToken = token;
		const refreshTk = localStorage.getItem(REFRESH_KEY);

		setUser(null);
		setToken(null);
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(REFRESH_KEY);
		localStorage.removeItem(USER_KEY);

		if (currentToken) {
			try {
				await shopFetch('/auth/logout', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${currentToken}`,
						...(refreshTk ? { 'x-refresh-token': refreshTk } : {}),
					},
				});
			} catch {
				/* best-effort */
			}
		}
	}, [token]);

	const value = useMemo(
		() => ({ user, token, loading, login, register, logout }),
		[user, token, loading, login, register, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
