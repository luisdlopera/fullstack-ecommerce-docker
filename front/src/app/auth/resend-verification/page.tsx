'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Form, Input } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';

export default function ResendVerificationPage() {
	const { resendVerification } = useAuth();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setMessage('');
		setError('');

		const formData = new FormData(event.currentTarget);
		const email = String(formData.get('email') ?? '');

		try {
			const msg = await resendVerification(email);
			setMessage(msg);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No fue posible reenviar la verificación.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className='mx-auto mt-28 w-full max-w-md px-4 text-black'>
			<Form className='flex flex-col gap-3' onSubmit={handleSubmit}>
				<h1 className='text-3xl font-bold'>Reenviar verificación</h1>
				<p className='text-sm text-gray-600'>Ingresa tu correo y te enviaremos otro enlace de verificación.</p>
				<Input isRequired type='email' name='email' label='Correo' placeholder='tu@correo.com' />
				{message ? <p className='rounded-lg bg-green-50 p-3 text-sm text-green-700'>{message}</p> : null}
				{error ? <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</p> : null}
				<Button type='submit' color='primary' isLoading={loading}>
					Reenviar enlace
				</Button>
				<Link href='/auth' className='text-sm text-gray-600 hover:underline'>
					Volver al login
				</Link>
			</Form>
		</main>
	);
}
