'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Chip, Input, Spinner } from '@heroui/react';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/features/admin';
import { bffFetch } from '@/lib/bff-fetch';
import { formatRoleLabel } from '@/lib/format-role-label';

type EditableProfile = {
	name: string;
	email: string;
	phone: string | null;
	image: string | null;
	role: string;
};

export default function AccountProfilePage() {
	const { user, refreshSession } = useAuth();
	const [profile, setProfile] = useState<EditableProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (!user) return;
		const run = async () => {
			setLoading(true);
			try {
				const res = await bffFetch('/users/me/profile');
				if (!res.ok) throw new Error('No profile endpoint');
				setProfile((await res.json()) as EditableProfile);
			} catch {
				setProfile({
					name: user.name,
					email: user.email,
					phone: null,
					image: null,
					role: user.role,
				});
			} finally {
				setLoading(false);
			}
		};
		void run();
	}, [user]);

	if (!user || loading || !profile) {
		return (
			<div className='flex min-h-[50vh] items-center justify-center'>
				<Spinner size='lg' />
			</div>
		);
	}

	const handleSave = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setMessage('');

		const fd = new FormData(e.currentTarget);
		const body = {
			name: (fd.get('name') as string).trim(),
			phone: ((fd.get('phone') as string).trim() || null) as string | null,
			image: ((fd.get('image') as string).trim() || null) as string | null,
		};

		try {
			const res = await bffFetch('/users/me/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error('No se pudo guardar');
			setProfile((await res.json()) as EditableProfile);
			await refreshSession();
			setMessage('Datos actualizados correctamente.');
		} catch {
			setMessage('No fue posible actualizar tus datos.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<main className='w-full'>
			<header className='mb-6'>
				<h1 className='text-3xl font-bold'>Editar datos del usuario</h1>
				<p className='mt-1 text-sm text-gray-600'>Actualiza tu información personal de forma segura.</p>
			</header>

			<section className='mb-6 rounded-2xl border border-gray-200 p-6'>
				<div className='mb-4 flex items-center gap-2'>
					<span className='font-semibold'>Rol:</span>
					<Chip size='sm' color={isAdminRole(profile.role) ? 'primary' : 'default'}>
						{formatRoleLabel(profile.role)}
					</Chip>
				</div>

				<form onSubmit={handleSave} className='flex flex-col gap-4'>
					<Input isRequired name='name' label='Nombre' defaultValue={profile.name} minLength={2} />
					<Input isReadOnly name='email' label='Correo' defaultValue={profile.email} type='email' />
					<Input name='phone' label='Teléfono' defaultValue={profile.phone ?? ''} />
					<Input name='image' label='URL de foto de perfil' defaultValue={profile.image ?? ''} />

					{message && (
						<p
							className={`rounded-lg p-3 text-sm ${message.startsWith('No') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
						>
							{message}
						</p>
					)}

					<Button type='submit' color='primary' isLoading={saving} startContent={<Save size={16} />}>
						Guardar cambios
					</Button>
				</form>
			</section>
		</main>
	);
}
