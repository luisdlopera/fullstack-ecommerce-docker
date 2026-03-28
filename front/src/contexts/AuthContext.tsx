'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role: string;
};

type AuthContextType = {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function nestErrorMessage(body: unknown, fallback: string): string {
	if (!body || typeof body !== 'object') return fallback;
	const msg = (body as { message?: unknown }).message;
	if (typeof msg === 'string') return msg;
	if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) return msg.join('. ');
	return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshSession = useCallback(async () => {
		const res = await fetch('/api/auth/session', { credentials: 'include' });
		if (!res.ok) {
			setUser(null);
			return;
		}
		const data = (await res.json()) as { user: AuthUser | null };
		setUser(data.user ?? null);
	}, []);

	useEffect(() => {
		queueMicrotask(async () => {
			try {
				await refreshSession();
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		});
	}, [refreshSession]);

	const login = useCallback(async (email: string, password: string) => {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.trim(), password }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'Error al iniciar sesión'));
		}

		const data = (await res.json()) as { user: AuthUser };
		setUser(data.user);
	}, []);

	const register = useCallback(async (name: string, email: string, password: string) => {
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'Error al registrarse'));
		}

		const data = (await res.json()) as { user: AuthUser };
		setUser(data.user);
	}, []);

	const logout = useCallback(async () => {
		setUser(null);
		try {
			await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
		} catch {
			/* best-effort */
		}
	}, []);

	const value = useMemo(
		() => ({ user, loading, login, register, logout, refreshSession }),
		[user, loading, login, register, logout, refreshSession],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
