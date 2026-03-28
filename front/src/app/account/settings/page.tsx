'use client';

import { FormEvent, useState } from 'react';
import { Button, Input } from '@heroui/react';
import { KeyRound } from 'lucide-react';
import { bffFetch } from '@/lib/bff-fetch';

export default function AccountSettingsPage() {
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setMessage('');

		const form = new FormData(e.currentTarget);
		const currentPassword = (form.get('currentPassword') as string) ?? '';
		const newPassword = (form.get('newPassword') as string) ?? '';
		const confirmPassword = (form.get('confirmPassword') as string) ?? '';

		if (newPassword.length < 8) {
			setMessage('La nueva contraseña debe tener mínimo 8 caracteres.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setMessage('La confirmación no coincide con la nueva contraseña.');
			return;
		}

		setSaving(true);
		try {
			const res = await bffFetch('/users/me/password', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword }),
			});
			if (!res.ok) throw new Error('error');
			setMessage('Contraseña actualizada correctamente.');
			e.currentTarget.reset();
		} catch {
			setMessage('No fue posible actualizar la contraseña. Revisa tu contraseña actual.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<main className='w-full text-black'>
			<header className='mb-6'>
				<h1 className='text-3xl font-bold'>Configuración</h1>
				<p className='mt-1 text-sm text-gray-600'>Cambia tu contraseña de acceso.</p>
			</header>

			<section className='max-w-xl rounded-2xl border border-gray-200 p-6'>
				<form onSubmit={handleChangePassword} className='flex flex-col gap-4'>
					<Input isRequired type='password' name='currentPassword' label='Contraseña actual' minLength={6} />
					<Input isRequired type='password' name='newPassword' label='Nueva contraseña' minLength={8} />
					<Input
						isRequired
						type='password'
						name='confirmPassword'
						label='Confirmar nueva contraseña'
						minLength={8}
					/>

					{message && (
						<p
							className={`rounded-lg p-3 text-sm ${message.startsWith('Contraseña') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
						>
							{message}
						</p>
					)}

					<Button type='submit' color='primary' isLoading={saving} startContent={<KeyRound size={16} />}>
						Actualizar contraseña
					</Button>
				</form>
			</section>
		</main>
	);
}
