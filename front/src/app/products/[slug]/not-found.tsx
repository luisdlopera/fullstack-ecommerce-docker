import Link from 'next/link';

export default function ProductNotFound() {
	return (
		<main className='mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-4 bg-neutral-50 px-4 pt-28 text-neutral-900'>
			<h1 className='text-2xl font-semibold'>Producto no encontrado</h1>
			<Link
				href='/'
				className='inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800'
			>
				Volver al inicio
			</Link>
		</main>
	);
}
