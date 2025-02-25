import { Link, Image } from '@heroui/react';

export function Footer() {
	return (
		<footer className='absolute bottom-0 w-full bg-black py-8 text-center text-white mt-20'>
			<div className='relative z-10 flex flex-col items-center gap-4 my-10'>
				<h2 className='text-2xl font-bold'>NEXSTORE</h2>

				<p className='text-lg'>
					<span className='font-semibold'>Descubre una experiencia de compra única:</span>
					<br />
					moda, calidad y exclusividad en un solo lugar.
				</p>

				<div className='flex justify-center gap-4'>
					<Link href='#' aria-label='Facebook' className='text-xl hover:text-gray-400'>
						<Image src='/assets/icons/facebook.svg' alt='Facebook' width={24} height={24} />
					</Link>
					<Link href='#' aria-label='Instagram' className='text-xl hover:text-gray-400'>
						<Image src='/assets/icons/instagram.svg' alt='Facebook' width={24} height={24} />
					</Link>
				</div>

				<p className='text-xs text-gray-400'>©2024 Todos los derechos reservados a nexstore, open project</p>
			</div>

			<div className='absolute bottom-0 mt-20 flex w-full justify-center gap-6 bg-primary py-2 text-xs text-white'>
				<a href='#' className='hover:underline'>
					Términos y condiciones
				</a>
				<a href='#' className='hover:underline'>
					Política de privacidad
				</a>
				<a href='#' className='hover:underline'>
					Política de devoluciones
				</a>
			</div>
		</footer>
	);
}
