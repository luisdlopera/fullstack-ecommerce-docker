'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { type Country } from '@/lib/api';
import { bffFetch } from '@/lib/bff-fetch';
import { safeParseJson, shopFetch } from '@/lib/shop-api';

type UserAddress = {
	id: string;
	firstName: string;
	lastName: string;
	address: string;
	address2?: string;
	postalCode: string;
	city: string;
	phone: string;
	countryId: string;
	country?: { id: string; name: string };
};

export default function AccountAddressesPage() {
	const { user } = useAuth();
	const [address, setAddress] = useState<UserAddress | null>(null);
	const [countries, setCountries] = useState<Country[]>([]);
	const [loadingAddress, setLoadingAddress] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (!user) return;
		Promise.all([
			bffFetch('/users/me/address').then((r) => safeParseJson<UserAddress | null>(r, null)),
			shopFetch('/countries').then((r) => safeParseJson<Country[]>(r, [])),
		])
			.then(([addr, ctrs]) => {
				setAddress(addr);
				setCountries(ctrs);
			})
			.finally(() => setLoadingAddress(false));
	}, [user]);

	if (!user || loadingAddress) {
		return (
			<div className='flex min-h-[50vh] items-center justify-center'>
				<Spinner size='lg' />
			</div>
		);
	}

	const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setMessage('');

		const fd = new FormData(e.currentTarget);
		const body = {
			firstName: fd.get('firstName') as string,
			lastName: fd.get('lastName') as string,
			address: fd.get('address') as string,
			address2: (fd.get('address2') as string) || undefined,
			postalCode: fd.get('postalCode') as string,
			city: fd.get('city') as string,
			phone: fd.get('phone') as string,
			countryId: fd.get('countryId') as string,
		};

		try {
			const res = await bffFetch('/users/me/address', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error('Error al guardar');
			const data = await safeParseJson<UserAddress | null>(res, null);
			if (!data) throw new Error('Error al guardar');
			setAddress(data);
			setMessage('Dirección guardada correctamente.');
		} catch {
			setMessage('Error al guardar la dirección.');
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteAddress = async () => {
		setDeleting(true);
		setMessage('');
		try {
			const res = await bffFetch('/users/me/address', { method: 'DELETE' });
			if (!res.ok) throw new Error('Error');
			setAddress(null);
			setMessage('Dirección eliminada correctamente.');
		} catch {
			setMessage('Error al eliminar la dirección.');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<main className='w-full'>
			<header className='mb-6'>
				<h1 className='text-3xl font-bold'>Administrar direcciones</h1>
				<p className='mt-1 text-sm text-gray-600'>Gestiona tu dirección de envío principal.</p>
			</header>

			<section className='rounded-2xl border border-gray-200 p-6'>
				<form onSubmit={handleSaveAddress} className='flex flex-col gap-4'>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<Input isRequired name='firstName' label='Nombre' defaultValue={address?.firstName ?? ''} />
						<Input isRequired name='lastName' label='Apellido' defaultValue={address?.lastName ?? ''} />
					</div>
					<Input isRequired name='address' label='Dirección' defaultValue={address?.address ?? ''} />
					<Input name='address2' label='Dirección 2 (opcional)' defaultValue={address?.address2 ?? ''} />
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
						<Input isRequired name='city' label='Ciudad' defaultValue={address?.city ?? ''} />
						<Input
							isRequired
							name='postalCode'
							label='Código postal'
							defaultValue={address?.postalCode ?? ''}
						/>
						<Select
							isRequired
							name='countryId'
							label='País'
							defaultSelectedKeys={address?.countryId ? [address.countryId] : undefined}
						>
							{countries.map((country) => (
								<SelectItem key={country.id}>{country.name}</SelectItem>
							))}
						</Select>
					</div>
					<Input isRequired name='phone' label='Teléfono' defaultValue={address?.phone ?? ''} />

					{message && (
						<p
							className={`rounded-lg p-3 text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
						>
							{message}
						</p>
					)}

					<div className='flex flex-wrap gap-3'>
						<Button type='submit' color='primary' isLoading={saving} startContent={<Save size={16} />}>
							Guardar dirección
						</Button>
						<Button
							type='button'
							color='danger'
							variant='light'
							isLoading={deleting}
							startContent={<Trash2 size={16} />}
							onPress={handleDeleteAddress}
						>
							Eliminar dirección
						</Button>
					</div>
				</form>
			</section>
		</main>
	);
}
