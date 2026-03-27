'use client';

import { useEffect, useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Heart, LogOut, Package, Search, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/features/cart';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { isAdminRole } from '@/features/admin';
import { HEADER_NAV_ITEMS } from './header-nav';
import { HeaderMenuTrigger, HeaderMobileNav } from './HeaderMobileNav';

/** Scroll offset (px) after which the header uses solid background — aligned with hero height. */
const HEADER_SOLID_BG_SCROLL_Y = 648;

export function Header() {
	const pathname = usePathname();
	const router = useRouter();
	const { totalItems } = useCart();
	const { items: favoriteItems } = useFavorites();
	const { user, logout } = useAuth();
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const isHome = pathname === '/';

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > HEADER_SOLID_BG_SCROLL_Y);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		if (!mobileOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [mobileOpen]);

	const handleLogout = () => {
		logout();
		router.push('/');
	};

	return (
		<header
			className={`fixed top-0 z-50 mx-auto flex h-[84px] w-full items-center justify-center transition-all ${scrolled ? 'bg-white/40 text-black backdrop-blur-md' : 'bg-transparent text-white'}`}
		>
			<div className='mx-auto flex w-[90%] items-center justify-between'>
				<div>
					<Link
						href='/'
						className={`text-2xl font-bold ${scrolled || !isHome ? 'text-black' : 'text-white'}`}
					>
						NEXSTORE
					</Link>
				</div>

				<div className='hidden items-center justify-center gap-3 lg:flex'>
					{HEADER_NAV_ITEMS.map(({ label, path }) => {
						const isActive = pathname === `/${path}` || (pathname === '/' && path === '');
						return (
							<div key={path || 'home'}>
								<Link
									href={path ? `/${path}` : '/'}
									className={`text-black ${scrolled ? 'text-black' : isHome ? 'text-white' : 'text-black'} ${isActive ? 'bg-primary rounded-xl px-3 py-2 font-bold text-white' : 'rounded-xl px-3 py-2'} transition-colors duration-300 hover:bg-gray-200 hover:text-black`}
								>
									{label}
								</Link>
							</div>
						);
					})}
				</div>

				<div className='flex items-center gap-2 md:gap-4'>
					<HeaderMenuTrigger
						onOpen={() => setMobileOpen(true)}
						scrolled={scrolled}
						isHome={isHome}
					/>
					<div className='hidden md:flex'>
						<Button as={Link} href='/search' isIconOnly aria-label='Search' color='default'>
							<Search />
						</Button>
					</div>
					<div className='hidden md:flex'>
						<div className='relative inline-flex'>
							<Button as={Link} href='/favorites' isIconOnly aria-label='Like' color='default'>
								<Heart />
							</Button>
							{favoriteItems.length > 0 && (
								<span
									className='bg-danger pointer-events-none absolute -top-1 -right-1 z-20 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-lg px-1.5 text-xs leading-none font-bold text-white tabular-nums shadow-sm ring-1 ring-black/15'
									aria-hidden
								>
									{favoriteItems.length > 99 ? '99+' : favoriteItems.length}
								</span>
							)}
						</div>
					</div>
					<div className='flex'>
						<div className='relative inline-flex'>
							<Button as={Link} href='/cart' isIconOnly aria-label='Cart' color='default'>
								<ShoppingCart />
							</Button>
							{totalItems > 0 && (
								<span
									className='bg-primary pointer-events-none absolute -top-1 -right-1 z-20 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-lg px-1.5 text-xs leading-none font-bold text-white tabular-nums shadow-sm ring-1 ring-black/15'
									aria-hidden
								>
									{totalItems > 99 ? '99+' : totalItems}
								</span>
							)}
						</div>
					</div>
					<div className='hidden md:flex'>
						{user ? (
							<Dropdown>
								<DropdownTrigger>
									<Button
										aria-label='User menu'
										color='default'
										className='flex h-auto min-h-11 min-w-11 flex-col items-stretch gap-0.5 py-1.5 font-bold lg:min-w-0'
									>
										<span className='flex items-center gap-2'>
											<User size={18} />
											<span className='hidden lg:inline'>{user.name}</span>
										</span>
										{user.role === 'USER' && (
											<span className='hidden pl-7 text-left text-[10px] font-semibold tracking-wider text-gray-500 uppercase lg:block'>
												Área cliente
											</span>
										)}
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									aria-label='User actions'
									items={[
										{ key: 'shop', label: 'Comprar' },
										{ key: 'account', label: 'Mi cuenta' },
										{ key: 'orders', label: 'Mis pedidos' },
										...(isAdminRole(user.role) ? [{ key: 'admin', label: 'Panel admin' }] : []),
										{ key: 'logout', label: 'Cerrar sesión' },
									]}
								>
									{(item) => {
										const icons: Record<string, React.ReactNode> = {
											shop: <ShoppingBag size={16} />,
											account: <User size={16} />,
											orders: <Package size={16} />,
											admin: <Package size={16} />,
											logout: <LogOut size={16} />,
										};
										const actions: Record<string, () => void> = {
											shop: () => router.push('/'),
											account: () => router.push('/account'),
											orders: () => router.push('/orders'),
											admin: () => router.push('/admin'),
											logout: handleLogout,
										};
										return (
											<DropdownItem
												key={item.key}
												startContent={icons[item.key]}
												color={item.key === 'logout' ? 'danger' : 'default'}
												onPress={actions[item.key]}
											>
												{item.label}
											</DropdownItem>
										);
									}}
								</DropdownMenu>
							</Dropdown>
						) : (
							<Button
								as={Link}
								href='/auth'
								aria-label='Login'
								color='default'
								className='flex min-h-11 min-w-11 items-center justify-center gap-2 font-bold lg:min-w-0 lg:px-4'
							>
								<User size={18} />
								<span className='hidden lg:inline'>Iniciar sesión</span>
							</Button>
						)}
					</div>
				</div>
			</div>

			<HeaderMobileNav
				open={mobileOpen}
				onClose={() => setMobileOpen(false)}
				pathname={pathname}
				user={user ? { name: user.name, role: user.role } : null}
				favoriteCount={favoriteItems.length}
				cartCount={totalItems}
				onLogout={handleLogout}
				onNavigate={(href) => router.push(href)}
			/>
		</header>
	);
}
