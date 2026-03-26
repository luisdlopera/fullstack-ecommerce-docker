'use client';

import { useEffect, useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { Heart, LogOut, Package, Search, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { isAdminRole } from '@/types/admin';

interface ItemToUrlMap {
	Inicio: string;
	Nuevo: string;
	Hombre: string;
	Mujer: string;
	Niños: string;
}

export function Header() {
	const pathname = usePathname();
	const router = useRouter();
	const { totalItems } = useCart();
	const { items: favoriteItems } = useFavorites();
	const { user, logout } = useAuth();
	const menuItems = ['Inicio', 'Nuevo', 'Hombre', 'Mujer', 'Niños'];
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 648);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const itemToUrlMap: ItemToUrlMap = {
		Inicio: '',
		Nuevo: 'new',
		Hombre: 'men',
		Mujer: 'women',
		Niños: 'kids',
	};

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
						className={`text-2xl font-bold ${scrolled || pathname !== '/' ? 'text-black' : 'text-white'}`}
					>
						NEXSTORE
					</Link>
				</div>

				<div className='hidden items-center justify-center gap-3 sm:flex'>
					{menuItems.map((item, index) => {
						const url = itemToUrlMap[item as keyof ItemToUrlMap];
						const isActive = pathname === `/${url}` || (pathname === '/' && url === '');
						return (
							<div key={index}>
								<Link
									href={`/${url}`}
									className={`text-black ${scrolled ? 'text-black' : pathname === '/' ? 'text-white' : 'text-black'} ${isActive ? 'rounded-xl bg-primary px-3 py-2 font-bold text-white' : 'rounded-xl px-3 py-2'} transition-colors duration-300 hover:bg-gray-200 hover:text-black`}
								>
									{item}
								</Link>
							</div>
						);
					})}
				</div>

				<div className='flex gap-4'>
					<div className='hidden lg:flex'>
						<Button as={Link} href='/search' isIconOnly aria-label='Search' color='default'>
							<Search />
						</Button>
					</div>
					<div className='hidden sm:flex'>
						<div className='relative inline-flex'>
							<Button as={Link} href='/favorites' isIconOnly aria-label='Like' color='default'>
								<Heart />
							</Button>
							{favoriteItems.length > 0 && (
								<span
									className='pointer-events-none absolute -right-1 -top-1 z-20 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-lg border-2 border-white bg-danger px-1.5 text-xs font-bold tabular-nums leading-none text-white shadow-sm dark:border-neutral-900'
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
									className='pointer-events-none absolute -right-1 -top-1 z-20 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-lg border-2 border-white bg-primary px-1.5 text-xs font-bold tabular-nums leading-none text-white shadow-sm dark:border-neutral-900'
									aria-hidden
								>
									{totalItems > 99 ? '99+' : totalItems}
								</span>
							)}
						</div>
					</div>
					<div className='hidden lg:flex'>
						{user ? (
							<Dropdown>
								<DropdownTrigger>
									<Button
										aria-label='User menu'
										color='default'
										className='flex h-auto min-h-10 flex-col items-stretch gap-0.5 py-1.5 font-bold'
									>
										<span className='flex items-center gap-2'>
											<User size={18} />
											{user.name}
										</span>
										{user.role === 'USER' && (
											<span className='pl-7 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
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
									{ key: 'logout', label: 'Cerrar sesión' }
								]}
							>
								{(item) => {
									const icons: Record<string, React.ReactNode> = {
										shop: <ShoppingBag size={16} />,
										account: <User size={16} />,
										orders: <Package size={16} />,
										admin: <Package size={16} />,
										logout: <LogOut size={16} />
									};
									const actions: Record<string, () => void> = {
										shop: () => router.push('/'),
										account: () => router.push('/account'),
										orders: () => router.push('/orders'),
										admin: () => router.push('/admin'),
										logout: handleLogout
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
								className='flex items-center gap-2 font-bold'
							>
								<User />
								Iniciar sesión
							</Button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
