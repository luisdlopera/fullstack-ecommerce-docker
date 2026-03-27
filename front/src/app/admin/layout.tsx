'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/features/admin';
import {
	LayoutDashboard,
	Users,
	ShoppingCart,
	Package,
	FolderTree,
	Globe,
	LogOut,
	Menu,
	X,
	ChevronRight,
} from 'lucide-react';
const Toaster = dynamic(
	() => import('react-hot-toast').then((m) => ({ default: m.Toaster })),
	{ ssr: false },
);

const NAV_ITEMS = [
	{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/admin/users', label: 'Usuarios', icon: Users },
	{ href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
	{ href: '/admin/products', label: 'Productos', icon: Package },
	{ href: '/admin/categories', label: 'Categorías', icon: FolderTree },
	{ href: '/admin/countries', label: 'Países', icon: Globe },
];

function getBreadcrumbs(pathname: string) {
	const segments = pathname.split('/').filter(Boolean);
	return segments.map((seg, i) => ({
		label: seg.charAt(0).toUpperCase() + seg.slice(1),
		href: '/' + segments.slice(0, i + 1).join('/'),
	}));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, loading, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		if (!loading && (!user || !isAdminRole(user.role))) {
			router.replace('/');
		}
	}, [loading, user, router]);

	if (loading || !user || !isAdminRole(user.role)) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-50'>
				<div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black' />
			</div>
		);
	}

	const breadcrumbs = getBreadcrumbs(pathname);

	return (
		<div className='flex min-h-screen bg-gray-50'>
			<Toaster position='top-right' toastOptions={{ duration: 3000 }} />

			{sidebarOpen && (
				<div className='fixed inset-0 z-30 bg-black/30 lg:hidden' onClick={() => setSidebarOpen(false)} />
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className='flex h-16 items-center gap-2 border-b border-gray-200 px-6'>
					<Link href='/admin' className='text-xl font-bold tracking-tight text-black'>
						NEXSTORE
					</Link>
					<span className='rounded bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white'>ADMIN</span>
					<button className='ml-auto lg:hidden' onClick={() => setSidebarOpen(false)}>
						<X size={20} />
					</button>
				</div>

				<nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
					{NAV_ITEMS.map((item) => {
						const isActive =
							item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setSidebarOpen(false)}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
									isActive
										? 'bg-black text-white'
										: 'text-gray-600 hover:bg-gray-100 hover:text-black'
								}`}
							>
								<item.icon size={18} />
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className='border-t border-gray-200 p-4'>
					<div className='mb-3 text-xs text-gray-500'>
						<p className='font-medium text-gray-800'>{user.name}</p>
						<p>{user.email}</p>
						<p className='mt-0.5 uppercase'>{user.role.replace('_', ' ')}</p>
					</div>
					<button
						onClick={() => {
							logout();
							router.replace('/');
						}}
						className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600'
					>
						<LogOut size={16} />
						Cerrar sesión
					</button>
				</div>
			</aside>

			<div className='flex flex-1 flex-col'>
				<header className='sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-8'>
					<button className='lg:hidden' onClick={() => setSidebarOpen(true)}>
						<Menu size={22} />
					</button>

					<nav className='flex items-center gap-1 text-sm text-gray-500'>
						{breadcrumbs.map((crumb, i) => (
							<span key={crumb.href} className='flex items-center gap-1'>
								{i > 0 && <ChevronRight size={14} />}
								{i === breadcrumbs.length - 1 ? (
									<span className='font-medium text-gray-900'>{crumb.label}</span>
								) : (
									<Link href={crumb.href} className='hover:text-black'>
										{crumb.label}
									</Link>
								)}
							</span>
						))}
					</nav>
				</header>

				<main className='flex-1 p-4 lg:p-8'>{children}</main>
			</div>
		</div>
	);
}
