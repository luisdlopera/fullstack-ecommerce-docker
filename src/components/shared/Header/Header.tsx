'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { Heart, Search, ShoppingCart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface ItemToUrlMap {
	Inicio: string;
	Nuevo: string;
	Hombre: string;
	Mujer: string;
	Niños: string;
}

export function Header() {
	const pathname = usePathname();
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

	return (
		<header
			className={`fixed top-0 z-20 mx-auto flex h-[84px] w-full items-center justify-center transition-all ${scrolled ? 'bg-white/40 text-black backdrop-blur-md' : 'bg-transparent text-white'}`}
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

				<div className='hidden items-center justify-center gap-12 sm:flex'>
					{menuItems.map((item, index) => {
						const url = itemToUrlMap[item as keyof ItemToUrlMap]; // Type assertion here

						const isActive = pathname === `/${url}` || (pathname === '/' && url === '');
						return (
							<div key={index}>
								<Link
									href={`/${url}`}
									className={`text-black ${scrolled ? 'text-black' : pathname === '/' ? 'text-white' : 'text-black'} ${isActive ? 'rounded-xl bg-primary px-5 py-2 font-bold text-white' : 'rounded-xl px-5 py-2'} transition-colors duration-300 hover:bg-gray-200 hover:text-black`}
								>
									{item}
								</Link>
							</div>
						);
					})}
				</div>

				<div className='flex gap-4'>
					<div className='hidden lg:flex'>
						<Button as={Link} href='#' isIconOnly aria-label='Search' color='default'>
							<Search />
						</Button>
					</div>
					<div className='hidden lg:flex'>
						<Button as={Link} href='#' isIconOnly aria-label='Like' color='default'>
							<Heart />
						</Button>
					</div>
					<div className='hidden lg:flex'>
						<Button as={Link} href='#' isIconOnly aria-label='Cart' color='default'>
							<ShoppingCart />
						</Button>
					</div>
					<div className='hidden lg:flex'>
						<Button
							as={Link}
							href='/login'
							aria-label='Login'
							color='default'
							className='flex items-center gap-2 font-bold'
						>
							<User />
							Iniciar sesión
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
