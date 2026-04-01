'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PERMISSIONS, type PermissionKey } from '@/features/admin';
import { usePermissions } from '@/hooks/usePermissions';
import { formatRoleLabel, getRoleBadgeClass } from '@/lib/format-role-label';
import {
	LayoutDashboard,
	Users,
	ShoppingCart,
	Package,
	FolderTree,
	LogOut,
	Menu,
	X,
	ChevronRight,
	ShieldCheck,
	Settings,
	Wallet,
	Percent,
	Boxes,
} from 'lucide-react';
const Toaster = dynamic(() => import('react-hot-toast').then((m) => ({ default: m.Toaster })), { ssr: false });

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; permission: PermissionKey }[] = [
	{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
	{ href: '/admin/users', label: 'Usuarios', icon: Users, permission: PERMISSIONS.USERS_READ },
	{ href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
	{ href: '/admin/products', label: 'Productos', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
	{ href: '/admin/categories', label: 'Categorías', icon: FolderTree, permission: PERMISSIONS.CATEGORIES_READ },
	{ href: '/admin/inventory', label: 'Inventario', icon: Boxes, permission: PERMISSIONS.INVENTORY_READ },
	{ href: '/admin/promotions', label: 'Promociones', icon: Percent, permission: PERMISSIONS.PROMOTIONS_MANAGE },
	{ href: '/admin/payments', label: 'Pagos', icon: Wallet, permission: PERMISSIONS.PAYMENTS_READ },
	{ href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck, permission: PERMISSIONS.AUDIT_READ },
	{ href: '/admin/countries', label: 'Settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
];

const ROUTE_PERMISSIONS: Array<{ startsWith: string; permission: PermissionKey }> = [
	{ startsWith: '/admin/users', permission: PERMISSIONS.USERS_READ },
	{ startsWith: '/admin/orders', permission: PERMISSIONS.ORDERS_READ },
	{ startsWith: '/admin/products', permission: PERMISSIONS.PRODUCTS_READ },
	{ startsWith: '/admin/categories', permission: PERMISSIONS.CATEGORIES_READ },
	{ startsWith: '/admin/inventory', permission: PERMISSIONS.INVENTORY_READ },
	{ startsWith: '/admin/promotions', permission: PERMISSIONS.PROMOTIONS_MANAGE },
	{ startsWith: '/admin/payments', permission: PERMISSIONS.PAYMENTS_READ },
	{ startsWith: '/admin/audit-logs', permission: PERMISSIONS.AUDIT_READ },
	{ startsWith: '/admin/countries', permission: PERMISSIONS.SETTINGS_MANAGE },
	{ startsWith: '/admin', permission: PERMISSIONS.DASHBOARD_READ },
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
	const { user, loading, logout, hasPermission, isAdmin } = usePermissions();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const visibleNavItems = useMemo(() => {
		if (!user) return [];
		return NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => {
			if (item.href === '/admin/users' && user.role === 'SUPPORT') {
				return { ...item, label: 'Clientes' };
			}
			return item;
		});
	}, [hasPermission, user]);

	useEffect(() => {
		if (!loading && (!user || !isAdmin)) {
			router.replace('/forbidden');
		}
	}, [isAdmin, loading, user, router]);

	useEffect(() => {
		if (loading || !user || !isAdmin) return;

		const routePermission = ROUTE_PERMISSIONS.find((item) => pathname.startsWith(item.startsWith));
		if (routePermission && !hasPermission(routePermission.permission)) {
			router.replace('/forbidden');
		}
	}, [hasPermission, isAdmin, loading, pathname, router, user]);

	if (loading || !user || !isAdmin) {
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
					<span className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider shadow-sm ${getRoleBadgeClass(user.role)}`}>
						{formatRoleLabel(user.role)}
					</span>
					<button className='ml-auto lg:hidden' onClick={() => setSidebarOpen(false)}>
						<X size={20} />
					</button>
				</div>

				<nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
					{visibleNavItems.map((item) => {
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
						<p className='mt-0.5'>{formatRoleLabel(user.role)}</p>
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
