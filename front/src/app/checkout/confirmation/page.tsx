'use client';

import { Button } from '@heroui/react';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ConfirmationContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get('orderId');

	return (
		<main className='mx-auto mt-28 flex w-11/12 max-w-2xl flex-col items-center gap-6 pb-16 text-center text-black'>
			<CheckCircle size={80} className='text-green-500' />
			<h1 className='text-3xl font-bold'>Pedido confirmado</h1>
			<p className='text-lg text-gray-600'>
				Tu pedido ha sido creado exitosamente.
			</p>

			{orderId && (
				<div className='rounded-xl bg-gray-50 px-6 py-4'>
					<p className='text-sm text-gray-500'>ID del pedido</p>
					<p className='font-mono text-lg font-semibold'>{orderId}</p>
				</div>
			)}

			<p className='text-sm text-gray-500'>
				Recibirás la confirmación de tu pedido por correo electrónico.
			</p>

			<div className='flex gap-4'>
				<Button as={Link} href='/' color='primary' size='lg'>
					Seguir comprando
				</Button>
			</div>
		</main>
	);
}

export default function ConfirmationPage() {
	return (
		<Suspense>
			<ConfirmationContent />
		</Suspense>
	);
}
