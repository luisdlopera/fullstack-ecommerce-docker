'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Form } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/shared/PasswordInput';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
	const router = useRouter();
	const { resetPassword } = useAuth();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setMessage('');
		setError('');

		const formData = new FormData(event.currentTarget);
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (newPassword.length < 10) {
			setLoading(false);
			setError('La contraseña debe tener al menos 10 caracteres.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setLoading(false);
			setError('La confirmación no coincide con la contraseña.');
			return;
		}

		try {
			await resetPassword(params.token, newPassword);
			setMessage('Contraseña restablecida. Ahora puedes iniciar sesión.');
			setTimeout(() => router.push('/auth'), 1200);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No fue posible restablecer la contraseña.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className='mx-auto mt-28 w-full max-w-md px-4 text-black'>
			<Form className='flex flex-col gap-3' onSubmit={handleSubmit}>
				<h1 className='text-3xl font-bold'>Restablecer contraseña</h1>
				<p className='text-sm text-gray-600'>Crea una nueva contraseña para tu cuenta.</p>
				<PasswordInput isRequired name='newPassword' label='Nueva contraseña' minLength={10} />
				<PasswordInput isRequired name='confirmPassword' label='Confirmar contraseña' minLength={10} />
				{message ? <p className='rounded-lg bg-green-50 p-3 text-sm text-green-700'>{message}</p> : null}
				{error ? <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</p> : null}
				<Button type='submit' color='primary' isLoading={loading}>
					Guardar nueva contraseña
				</Button>
				<Link href='/auth' className='text-sm text-gray-600 hover:underline'>
					Volver al login
				</Link>
			</Form>
		</main>
	);
}
