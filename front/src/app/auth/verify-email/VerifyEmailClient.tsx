'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';

export function VerifyEmailClient({ token }: { token?: string }) {
	const { verifyEmail } = useAuth();
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		void (async () => {
			if (!token) {
				setError('El enlace de verificación es inválido.');
				setLoading(false);
				return;
			}

			try {
				const msg = await verifyEmail(token);
				setMessage(msg);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'No fue posible verificar el correo.');
			} finally {
				setLoading(false);
			}
		})();
	}, [token, verifyEmail]);

	return (
		<main className='mx-auto mt-28 flex min-h-screen w-full max-w-md flex-col px-4 text-black'>
			<div className='flex flex-col gap-3'>
				<h1 className='text-3xl font-bold'>Verificación de correo</h1>
				{loading ? <p className='text-sm text-gray-600'>Validando tu enlace...</p> : null}
				{message ? <p className='rounded-lg bg-green-50 p-3 text-sm text-green-700'>{message}</p> : null}
				{error ? <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</p> : null}
				<Button as={Link} href='/auth' color='primary' className='w-full'>
					Ir a iniciar sesión
				</Button>
			</div>
		</main>
	);
}
