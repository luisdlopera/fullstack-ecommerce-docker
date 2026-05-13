'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SessionExpiredAlert } from '@/components/auth/SessionExpiredAlert';

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	roles: string[];
	permissions: string[];
};

type AuthContextType = {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<string>;
	verifyEmail: (token: string) => Promise<string>;
	resendVerification: (email: string) => Promise<string>;
	forgotPassword: (email: string) => Promise<void>;
	resetPassword: (token: string, newPassword: string) => Promise<void>;
	logout: () => Promise<void>;
	refreshSession: () => Promise<void>;
	sessionExpired: boolean;
	triggerSessionExpired: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthUserResponse = {
	id: string;
	name: string;
	email: string;
	role: string;
	roles?: string[];
	permissions?: string[];
};

const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authFrontLog(event: string, payload: Record<string, unknown> = {}) {
	if (!AUTH_DEBUG) return;
	console.log(`[AUTH-FRONT] ${event}`, payload);
}

function nestErrorMessage(body: unknown, fallback: string): string {
	if (!body || typeof body !== 'object') return fallback;
	const msg = (body as { message?: unknown }).message;
	if (typeof msg === 'string') return msg;
	if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) return msg.join('. ');
	return fallback;
}

function normalizeAuthUser(user: AuthUserResponse | null | undefined): AuthUser | null {
	if (!user) return null;

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		roles: user.roles?.length ? user.roles : [user.role],
		permissions: Array.isArray(user.permissions) ? user.permissions : [],
	};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [sessionExpired, setSessionExpired] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const triggerSessionExpired = useCallback(() => {
		setSessionExpired(true);
	}, []);

	const refreshSession = useCallback(async () => {
		authFrontLog('session start', {
			url: '/api/auth/session',
			credentials: 'include',
		});
		const res = await fetch('/api/auth/session', { credentials: 'include' });
		const raw = await res
			.clone()
			.text()
			.catch(() => '');
		authFrontLog('session response', {
			status: res.status,
			body: raw.slice(0, 800),
		});
		if (!res.ok) {
			authFrontLog('session failed', { status: res.status });
			setUser(null);
			return;
		}
		const data = (await res.json()) as { user: AuthUserResponse | null };
		authFrontLog('session parsed', {
			hasUser: Boolean(data.user),
			userId: data.user?.id,
			role: data.user?.role,
		});
		setUser(normalizeAuthUser(data.user));
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
		authFrontLog('login submit', {
			url: '/api/auth/login',
			method: 'POST',
			credentials: 'include',
			email: email.trim(),
			passwordLength: password?.length ?? 0,
		});
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.trim(), password }),
		});

		const raw = await res
			.clone()
			.text()
			.catch(() => '');
		authFrontLog('login response', {
			status: res.status,
			body: raw.slice(0, 800),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			authFrontLog('login failed', { status: res.status, body });
			throw new Error(nestErrorMessage(body, 'Error al iniciar sesión'));
		}

		const data = (await res.json()) as { user: AuthUserResponse };
		authFrontLog('login success', {
			hasUser: Boolean(data.user),
			userId: data.user?.id,
			role: data.user?.role,
		});
		setUser(normalizeAuthUser(data.user));
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

		const data = (await res.json()) as { message?: string };
		setUser(null);
		return data.message ?? 'Revisa tu correo para verificar tu cuenta.';
	}, []);

	const verifyEmail = useCallback(async (token: string) => {
		const res = await fetch('/api/auth/verify-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'No fue posible verificar tu correo'));
		}

		const data = (await res.json()) as { message?: string };
		return data.message ?? 'Correo verificado. Ya puedes iniciar sesión.';
	}, []);

	const resendVerification = useCallback(async (email: string) => {
		const res = await fetch('/api/auth/resend-verification', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.trim() }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'No fue posible reenviar la verificación'));
		}

		const data = (await res.json()) as { message?: string };
		return data.message ?? 'Si el correo existe, enviamos una nueva verificación.';
	}, []);

	const logout = useCallback(async () => {
		setUser(null);
		try {
			await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
		} catch {
			/* best-effort */
		}
	}, []);

	const forgotPassword = useCallback(async (email: string) => {
		const res = await fetch('/api/auth/forgot-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.trim() }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'No fue posible iniciar la recuperación de contraseña'));
		}
	}, []);

	const resetPassword = useCallback(async (token: string, newPassword: string) => {
		const res = await fetch('/api/auth/reset-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, newPassword }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(nestErrorMessage(body, 'No fue posible restablecer la contraseña'));
		}
	}, []);

	const value = useMemo(
		() => ({
			user,
			loading,
			login,
			register,
			verifyEmail,
			resendVerification,
			forgotPassword,
			resetPassword,
			logout,
			refreshSession,
			sessionExpired,
			triggerSessionExpired,
		}),
		[
			user,
			loading,
			login,
			register,
			verifyEmail,
			resendVerification,
			forgotPassword,
			resetPassword,
			logout,
			refreshSession,
			sessionExpired,
			triggerSessionExpired,
		],
	);

	const handleSessionExpiredConfirm = useCallback(() => {
		setSessionExpired(false);
		const redirectPath = encodeURIComponent(pathname);
		router.push(`/auth?redirect=${redirectPath}`);
	}, [pathname, router]);

	return (
		<AuthContext.Provider value={value}>
			{children}
			<SessionExpiredAlert isOpen={sessionExpired} onConfirm={handleSessionExpiredConfirm} />
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
