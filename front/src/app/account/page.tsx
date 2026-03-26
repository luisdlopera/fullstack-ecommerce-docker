'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { LogOut, Package, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getClientApiUrl, type Country } from '@/lib/api';

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

export default function AccountPage() {
	const { user, token, logout, loading: authLoading } = useAuth();
	const router = useRouter();
	const [address, setAddress] = useState<UserAddress | null>(null);
	const [countries, setCountries] = useState<Country[]>([]);
	const [loadingAddress, setLoadingAddress] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	const safeJson = async <T,>(response: Response, fallback: T): Promise<T> => {
		if (!response.ok) return fallback;
		const text = await response.text();
		if (!text) return fallback;
		try {
			return JSON.parse(text) as T;
		} catch {
			return fallback;
		}
	};

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/auth');
		}
	}, [user, authLoading, router]);

	useEffect(() => {
		if (!token) return;
		const baseUrl = getClientApiUrl();

		Promise.all([
			fetch(`${baseUrl}/users/me/address`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then((r) => safeJson<UserAddress | null>(r, null)),
			fetch(`${baseUrl}/countries`).then((r) => safeJson<Country[]>(r, [])),
		])
			.then(([addr, ctrs]) => {
				setAddress(addr);
				setCountries(ctrs);
			})
			.finally(() => setLoadingAddress(false));
	}, [token]);

	const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!token) return;
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
			const baseUrl = getClientApiUrl();
			const res = await fetch(`${baseUrl}/users/me/address`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error('Error al guardar');
			const data = await safeJson<UserAddress | null>(res, null);
			if (!data) throw new Error('Error al guardar');
			setAddress(data);
			setMessage('Dirección guardada correctamente.');
		} catch {
			setMessage('Error al guardar la dirección.');
		} finally {
			setSaving(false);
		}
	};

	if (authLoading || !user) {
		return (
			<main className='flex min-h-screen items-center justify-center'>
				<Spinner size='lg' />
			</main>
		);
	}

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-4xl pb-16 text-black'>
			<div className='mb-8 flex items-center justify-between'>
				<h1 className='text-3xl font-bold'>Mi Cuenta</h1>
				<Button
					variant='light'
					color='danger'
					startContent={<LogOut size={16} />}
					onPress={() => {
						logout();
						router.push('/');
					}}
				>
					Cerrar sesión
				</Button>
			</div>

			<div className='mb-8 rounded-2xl border border-gray-200 p-6'>
				<h2 className='mb-4 text-xl font-bold'>Información personal</h2>
				<div className='flex flex-col gap-2'>
					<p>
						<span className='font-semibold'>Nombre:</span> {user.name}
					</p>
					<p>
						<span className='font-semibold'>Correo:</span> {user.email}
					</p>
					<p>
						<span className='font-semibold'>Rol:</span>{' '}
						<Chip size='sm' color={user.role !== 'USER' ? 'primary' : 'default'}>
							{user.role}
						</Chip>
					</p>
				</div>
			</div>

			<div className='mb-8 rounded-2xl border border-gray-200 p-6'>
				<div className='mb-4 flex items-center justify-between'>
					<h2 className='text-xl font-bold'>Dirección de envío</h2>
				</div>

				{loadingAddress ? (
					<Spinner size='sm' />
				) : (
					<form onSubmit={handleSaveAddress} className='flex flex-col gap-4'>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<Input
								isRequired
								name='firstName'
								label='Nombre'
								defaultValue={address?.firstName ?? ''}
							/>
							<Input
								isRequired
								name='lastName'
								label='Apellido'
								defaultValue={address?.lastName ?? ''}
							/>
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
								{countries.map((c) => (
									<SelectItem key={c.id}>{c.name}</SelectItem>
								))}
							</Select>
						</div>
						<Input isRequired name='phone' label='Teléfono' defaultValue={address?.phone ?? ''} />

						{message && (
							<p
								className={`rounded-lg p-3 text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
							>
								{message}
							</p>
						)}

						<Button type='submit' color='primary' isLoading={saving} startContent={<Save size={16} />}>
							Guardar dirección
						</Button>
					</form>
				)}
			</div>

			<Button as={Link} href='/orders' variant='bordered' startContent={<Package size={16} />}>
				Ver mis pedidos
			</Button>
		</main>
	);
}
