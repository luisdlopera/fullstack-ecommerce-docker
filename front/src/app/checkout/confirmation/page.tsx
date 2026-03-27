'use client';

import { Button } from '@heroui/react';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { bffFetch } from '@/lib/bff-fetch';

function ConfirmationContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get('orderId');
	const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id');
	const redirectStatus = searchParams.get('status');
	const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'failure'>('loading');
	const [message, setMessage] = useState('Validando pago...');

	useEffect(() => {
		let cancelled = false;

		const run = async () => {
			if (!paymentId) {
				if (redirectStatus === 'approved') {
					setStatus('pending');
					setMessage('Pago en proceso de confirmación. Revisa tus pedidos en unos minutos.');
					return;
				}

				setStatus(redirectStatus === 'failure' ? 'failure' : 'pending');
				setMessage(
					redirectStatus === 'failure'
						? 'El pago no fue aprobado. Puedes reintentar desde tu pedido.'
						: 'No recibimos el identificador de pago. Revisa el estado en tus pedidos.',
				);
				return;
			}

			const res = await bffFetch('/payments/mercadopago/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paymentId }),
			});

			if (cancelled) return;

			if (res.ok) {
				setStatus('approved');
				setMessage('Tu pago fue confirmado y tu orden está marcada como pagada.');
				return;
			}

			const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
			const msg =
				typeof body.message === 'string'
					? body.message
					: Array.isArray(body.message)
						? body.message.join('. ')
						: 'No pudimos confirmar el pago en este momento.';

			setStatus('failure');
			setMessage(msg);
		};

		void run();

		return () => {
			cancelled = true;
		};
	}, [paymentId, redirectStatus]);

	const isApproved = status === 'approved';

	return (
		<main className='mx-auto mt-28 flex w-11/12 max-w-2xl flex-col items-center gap-6 pb-16 text-center text-black'>
			<CheckCircle size={80} className={isApproved ? 'text-green-500' : 'text-amber-500'} />
			<h1 className='text-3xl font-bold'>{isApproved ? 'Pago confirmado' : 'Estado del pago'}</h1>
			<p className='text-lg text-gray-600'>{message}</p>

			{orderId && (
				<div className='rounded-xl bg-gray-50 px-6 py-4'>
					<p className='text-sm text-gray-500'>ID del pedido</p>
					<p className='font-mono text-lg font-semibold'>{orderId}</p>
				</div>
			)}

			{paymentId && (
				<div className='rounded-xl bg-gray-50 px-6 py-4'>
					<p className='text-sm text-gray-500'>ID del pago</p>
					<p className='font-mono text-lg font-semibold'>{paymentId}</p>
				</div>
			)}

			<p className='text-sm text-gray-500'>Puedes verificar o reintentar el pago desde tu historial de pedidos.</p>

			<div className='flex gap-4'>
				<Button as={Link} href='/orders' color='default' size='lg'>
					Ver mis pedidos
				</Button>
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
