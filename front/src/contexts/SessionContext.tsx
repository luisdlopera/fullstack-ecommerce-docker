'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Clock, AlertTriangle } from 'lucide-react';

type User = {
	id: string;
	email: string;
	name: string;
	role: string;
};

interface SessionContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	showSessionExpiredModal: boolean;
	dismissSessionModal: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const ACCESS_TOKEN_KEY = 'nexstore_access_token';
const TOKEN_EXPIRY_KEY = 'nexstore_token_expiry';

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// Store access token and expiry
	const storeToken = useCallback((accessToken: string, expiresInSeconds: number = 900) => {
		localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
		const expiry = Date.now() + expiresInSeconds * 1000;
		localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
	}, []);

	const clearToken = useCallback(() => {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(TOKEN_EXPIRY_KEY);
	}, []);

	const getAccessToken = useCallback(() => {
		return localStorage.getItem(ACCESS_TOKEN_KEY);
	}, []);

	// Attempt to refresh the session
	const refreshSession = useCallback(async (): Promise<boolean> => {
		try {
			const res = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include', // Sends httpOnly refresh cookie
				headers: { 'Content-Type': 'application/json' },
			});

			if (!res.ok) {
				// Refresh token also expired or invalid
				return false;
			}

			const data = await res.json();
			if (data.accessToken) {
				storeToken(data.accessToken, 900); // 15 minutes
				if (data.user) {
					setUser(data.user);
				}
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}, [storeToken]);

	// Check if token is about to expire (within 2 minutes)
	const checkTokenExpiry = useCallback(() => {
		const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
		if (!expiryStr) return;

		const expiry = parseInt(expiryStr, 10);
		const now = Date.now();
		const twoMinutes = 2 * 60 * 1000;

		if (expiry - now <= twoMinutes && expiry - now > 0) {
			// Token expiring within 2 minutes, try to refresh
			refreshSession();
		}
	}, [refreshSession]);

	// Initialize session on mount
	useEffect(() => {
		const initSession = async () => {
			const hasAccessToken = getAccessToken();

			if (!hasAccessToken) {
				// Try to get new access token with refresh cookie
				const refreshed = await refreshSession();
				if (!refreshed) {
					setUser(null);
				}
			} else {
				// Validate current session
				try {
					const res = await fetch('/api/auth/me', {
						headers: {
							Authorization: `Bearer ${hasAccessToken}`,
						},
					});

					if (res.ok) {
						const data = await res.json();
						setUser(data.user);
					} else if (res.status === 401) {
						// Token expired, try refresh
						const refreshed = await refreshSession();
						if (!refreshed) {
							setUser(null);
						}
					}
				} catch {
					setUser(null);
				}
			}

			setIsLoading(false);
		};

		initSession();
	}, [getAccessToken, refreshSession]);

	// Periodic token expiry check
	useEffect(() => {
		if (!user) return;

		const interval = setInterval(checkTokenExpiry, 30000); // Check every 30 seconds
		return () => clearInterval(interval);
	}, [user, checkTokenExpiry]);

	// Handle 401 errors globally
	useEffect(() => {
		const originalFetch = window.fetch;

		window.fetch = async (...args) => {
			const [url, config = {}] = args;

			// Skip auth endpoints
			if (typeof url === 'string' && url.includes('/api/auth/')) {
				return originalFetch(...args);
			}

			// Add auth header if we have a token
			const token = localStorage.getItem(ACCESS_TOKEN_KEY);
			if (token) {
				(config as RequestInit).headers = {
					...(config as RequestInit).headers,
					Authorization: `Bearer ${token}`,
				};
			}

			const response = await originalFetch(url, config);

			// Handle 401 - attempt refresh
			if (response.status === 401) {
				const refreshed = await refreshSession();

				if (!refreshed) {
					// Session completely expired
					clearToken();
					setUser(null);
					setShowSessionExpiredModal(true);
				} else {
					// Retry the original request with new token
					const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
					(config as RequestInit).headers = {
						...(config as RequestInit).headers,
						Authorization: `Bearer ${newToken}`,
					};
					return originalFetch(url, config);
				}
			}

			return response;
		};

		return () => {
			window.fetch = originalFetch;
		};
	}, [refreshSession, clearToken]);

	const login = useCallback(
		async (email: string, password: string) => {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ message: 'Login failed' }));
				throw new Error(error.message || 'Login failed');
			}

			const data = await res.json();
			storeToken(data.accessToken, 900);
			setUser(data.user);
		},
		[storeToken],
	);

	const logout = useCallback(async () => {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
		});
		clearToken();
		setUser(null);
	}, [clearToken]);

	const dismissSessionModal = useCallback(() => {
		setShowSessionExpiredModal(false);
		const redirectPath = encodeURIComponent(pathname);
		router.push(`/auth?redirect=${redirectPath}`);
	}, [pathname, router]);

	return (
		<SessionContext.Provider
			value={{
				user,
				isLoading,
				login,
				logout,
				showSessionExpiredModal,
				dismissSessionModal,
			}}
		>
			{children}

			{/* Session Expired Modal */}
			<Modal
				isOpen={showSessionExpiredModal}
				onOpenChange={(open) => {
					if (!open) dismissSessionModal();
				}}
				isDismissable={false}
				hideCloseButton
				size='md'
				placement='center'
			>
				<ModalContent>
					<ModalHeader className='flex flex-col items-center gap-2 pt-6'>
						<div className='rounded-full bg-amber-100 p-3'>
							<Clock className='h-8 w-8 text-amber-600' />
						</div>
						<span className='text-lg font-semibold'>Sesión Expirada</span>
					</ModalHeader>
					<ModalBody className='text-center'>
						<p className='text-gray-600'>
							Tu sesión ha expirado por inactividad. Por seguridad, necesitas iniciar sesión nuevamente.
						</p>
						<div className='mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800'>
							<div className='flex items-center gap-2'>
								<AlertTriangle className='h-4 w-4' />
								<span>Serás redirigido al login</span>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='primary' className='w-full' onPress={dismissSessionModal}>
							Ir al Login
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</SessionContext.Provider>
	);
}

export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error('useSession must be used within SessionProvider');
	}
	return context;
}
