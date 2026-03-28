'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ACCOUNT_NAV_ITEMS } from './user-account-nav';

function isItemActive(pathname: string, href: string): boolean {
	if (href === '/orders') return pathname === '/orders' || pathname.startsWith('/orders/');
	if (href === '/account/profile') return pathname === '/account' || pathname.startsWith('/account/profile');
	return pathname.startsWith(href);
}

export function UserAccountShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { user, loading, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		if (!loading && !user) {
			router.replace('/auth');
		}
	}, [loading, user, router]);

	if (loading || !user) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-50'>
				<div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black' />
			</div>
		);
	}

	return (
		<div className='mx-auto mt-24 flex w-11/12 max-w-6xl gap-6 pb-16 text-black'>
			{sidebarOpen && (
				<div className='fixed inset-0 z-30 bg-black/30 lg:hidden' onClick={() => setSidebarOpen(false)} />
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] lg:translate-x-0 lg:rounded-2xl lg:border ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className='flex items-center gap-2 border-b border-gray-200 px-5 py-4 lg:hidden'>
					<p className='text-sm font-semibold tracking-wide text-gray-500 uppercase'>Mi cuenta</p>
					<button className='ml-auto' onClick={() => setSidebarOpen(false)}>
						<X size={20} />
					</button>
				</div>

				<div className='hidden border-b border-gray-200 px-5 py-4 lg:block'>
					<p className='text-sm font-semibold tracking-wide text-gray-500 uppercase'>Mi cuenta</p>
					<p className='mt-1 text-base font-semibold text-black'>{user.name}</p>
					<p className='truncate text-xs text-gray-500'>{user.email}</p>
				</div>

				<nav className='flex-1 space-y-1 px-3 py-4'>
					{USER_ACCOUNT_NAV_ITEMS.map((item) => {
						const active = isItemActive(pathname, item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setSidebarOpen(false)}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
									active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<item.icon size={18} />
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className='border-t border-gray-200 p-4'>
					<button
						onClick={async () => {
							await logout();
							router.replace('/');
						}}
						className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600'
					>
						<LogOut size={16} />
						Cerrar sesión
					</button>
				</div>
			</aside>

			<div className='min-w-0 flex-1'>
				<div className='mb-4 lg:hidden'>
					<button
						className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium'
						onClick={() => setSidebarOpen(true)}
					>
						<Menu size={16} />
						Menú de cuenta
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
