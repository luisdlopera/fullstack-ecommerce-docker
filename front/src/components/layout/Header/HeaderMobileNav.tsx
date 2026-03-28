'use client';

import Link from 'next/link';
import { Button } from '@heroui/react';
import { Heart, LogOut, Menu, Package, Search, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';
import { HEADER_NAV_ITEMS } from './header-nav';
import { isAdminRole } from '@/features/admin';

type HeaderMobileNavProps = {
	open: boolean;
	onClose: () => void;
	pathname: string;
	user: { name: string; role: string } | null;
	favoriteCount: number;
	cartCount: number;
	onLogout: () => void;
	onNavigate: (href: string) => void;
};

export function HeaderMobileNav({
	open,
	onClose,
	pathname,
	user,
	favoriteCount,
	cartCount,
	onLogout,
	onNavigate,
}: HeaderMobileNavProps) {
	const go = (href: string) => {
		onNavigate(href);
		onClose();
	};

	if (!open) return null;

	return (
		<>
			<button
				type='button'
				className='fixed inset-0 z-60 bg-black/40 lg:hidden'
				aria-label='Cerrar menú'
				onClick={onClose}
			/>
			<div
				className='fixed inset-y-0 right-0 z-70 flex w-full max-w-80 flex-col border-l border-neutral-200 bg-white shadow-xl lg:hidden'
				role='dialog'
				aria-modal='true'
				aria-labelledby='mobile-nav-title'
			>
				<div className='flex items-center justify-between border-b border-neutral-100 px-4 py-3'>
					<span id='mobile-nav-title' className='text-lg font-bold text-neutral-900'>
						Menú
					</span>
					<Button isIconOnly variant='light' aria-label='Cerrar menú' onPress={onClose}>
						<X className='h-5 w-5' />
					</Button>
				</div>
				<nav className='flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4'>
					{HEADER_NAV_ITEMS.map(({ label, path }) => {
						const href = path ? `/${path}` : '/';
						const isActive = pathname === href || (pathname === '/' && path === '');
						return (
							<Link
								key={path || 'home'}
								href={href}
								onClick={onClose}
								className={`rounded-xl px-4 py-3 text-base font-medium ${
									isActive ? 'bg-primary text-white' : 'text-neutral-800 hover:bg-neutral-100'
								}`}
							>
								{label}
							</Link>
						);
					})}
					<hr className='my-2 border-neutral-100' />
					<Link
						href='/search'
						onClick={onClose}
						className='flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-800 hover:bg-neutral-100'
					>
						<Search className='h-5 w-5 shrink-0' />
						Buscar
					</Link>
					<Link
						href='/favorites'
						onClick={onClose}
						className='flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-800 hover:bg-neutral-100'
					>
						<Heart className='h-5 w-5 shrink-0' />
						Favoritos
						{favoriteCount > 0 && (
							<span className='bg-danger ml-auto rounded-md px-2 py-0.5 text-xs font-bold text-white'>
								{favoriteCount > 99 ? '99+' : favoriteCount}
							</span>
						)}
					</Link>
					<Link
						href='/cart'
						onClick={onClose}
						className='flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-800 hover:bg-neutral-100'
					>
						<ShoppingCart className='h-5 w-5 shrink-0' />
						Carrito
						{cartCount > 0 && (
							<span className='bg-primary ml-auto rounded-md px-2 py-0.5 text-xs font-bold text-white'>
								{cartCount > 99 ? '99+' : cartCount}
							</span>
						)}
					</Link>
					<hr className='my-2 border-neutral-100' />
					{user ? (
						<>
							<p className='px-4 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase'>
								Cuenta
							</p>
							<button
								type='button'
								className='flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-neutral-800 hover:bg-neutral-100'
								onClick={() => go('/')}
							>
								<ShoppingBag className='h-5 w-5 shrink-0' />
								Comprar
							</button>
							<button
								type='button'
								className='flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-neutral-800 hover:bg-neutral-100'
								onClick={() => go('/account')}
							>
								<User className='h-5 w-5 shrink-0' />
								Mi cuenta
							</button>
							<button
								type='button'
								className='flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-neutral-800 hover:bg-neutral-100'
								onClick={() => go('/orders')}
							>
								<Package className='h-5 w-5 shrink-0' />
								Mis pedidos
							</button>
							{isAdminRole(user.role) && (
								<button
									type='button'
									className='flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-neutral-800 hover:bg-neutral-100'
									onClick={() => go('/admin')}
								>
									<Package className='h-5 w-5 shrink-0' />
									Panel admin
								</button>
							)}
							<button
								type='button'
								className='mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50'
								onClick={() => {
									onLogout();
									onClose();
								}}
							>
								<LogOut className='h-5 w-5 shrink-0' />
								Cerrar sesión
							</button>
						</>
					) : (
						<Link
							href='/auth'
							onClick={onClose}
							className='text-primary hover:bg-primary/10 flex items-center gap-3 rounded-xl px-4 py-3 font-semibold'
						>
							<User className='h-5 w-5 shrink-0' />
							Iniciar sesión
						</Link>
					)}
				</nav>
			</div>
		</>
	);
}

export function HeaderMenuTrigger({
	onOpen,
	solidAppearance,
}: {
	onOpen: () => void;
	/** True when the header bar is solid (inner pages or home past hero). */
	solidAppearance: boolean;
}) {
	const tone = solidAppearance
		? 'text-neutral-900'
		: 'text-white data-[hover=true]:bg-white/10 data-[pressed=true]:bg-white/15';

	return (
		<div className='lg:hidden'>
			<Button
				isIconOnly
				aria-label='Abrir menú'
				variant='light'
				className={`min-h-11 min-w-11 ${tone}`}
				onPress={onOpen}
			>
				<Menu className='h-6 w-6' />
			</Button>
		</div>
	);
}
