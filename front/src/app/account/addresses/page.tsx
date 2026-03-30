'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Autocomplete, AutocompleteItem, Button, Input, Spinner } from '@heroui/react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { type Country, type UserAddress, type UserAddressListResponse } from '@/lib/api';
import { bffFetch } from '@/lib/bff-fetch';
import { safeParseJson, shopFetch } from '@/lib/shop-api';
import { ConfirmDialog } from '@/features/admin';
import { Pagination } from '@/features/collection';

const ITEMS_PER_PAGE = 6;

export default function AccountAddressesPage() {
	const { user } = useAuth();
	const [addresses, setAddresses] = useState<UserAddress[]>([]);
	const [countries, setCountries] = useState<Country[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalAddresses, setTotalAddresses] = useState(0);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
	const [loadingAddress, setLoadingAddress] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<UserAddress | null>(null);
	const [countryId, setCountryId] = useState('');
	const [message, setMessage] = useState('');

	const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;

	useEffect(() => {
		setCountryId(selectedAddress?.countryId ?? '');
	}, [selectedAddress?.countryId]);

	const loadAddresses = useCallback(async (targetPage = page) => {
		const response = await bffFetch(`/users/me/addresses?page=${targetPage}&limit=${ITEMS_PER_PAGE}`);
		const payload = await safeParseJson<UserAddressListResponse>(response, {
			data: [],
			meta: { page: targetPage, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 },
		});

		setAddresses(payload.data);
		setTotalPages(Math.max(1, payload.meta.totalPages));
		setTotalAddresses(payload.meta.total);

		if (payload.data.length === 0) {
			setSelectedAddressId(null);
			return;
		}

		setSelectedAddressId((current) => {
			if (current && payload.data.some((address) => address.id === current)) return current;
			return payload.data[0].id;
		});
	}, [page]);

	useEffect(() => {
		if (!user) return;
		Promise.all([loadAddresses(page), shopFetch('/countries').then((r) => safeParseJson<Country[]>(r, []))])
			.then(([, ctrs]) => setCountries(ctrs))
			.finally(() => setLoadingAddress(false));
	}, [user, page, loadAddresses]);

	useEffect(() => {
		if (!user || loadingAddress) return;
		setRefreshing(true);
		void loadAddresses(page).finally(() => setRefreshing(false));
	}, [page, user, loadingAddress, loadAddresses]);

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
			countryId,
		};

		try {
			if (!countryId) {
				throw new Error('Selecciona un país');
			}

			const method = selectedAddress ? 'PUT' : 'POST';
			const path = selectedAddress ? `/users/me/addresses/${selectedAddress.id}` : '/users/me/addresses';
			const res = await bffFetch(path, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error('Error al guardar');
			const data = await safeParseJson<UserAddress | null>(res, null);
			if (!data) throw new Error('Error al guardar');
			await loadAddresses(page);
			setSelectedAddressId(data.id);
			setMessage(selectedAddress ? 'Dirección actualizada correctamente.' : 'Dirección creada correctamente.');
		} catch {
			setMessage('Error al guardar la dirección.');
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteAddress = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		setMessage('');
		try {
			const res = await bffFetch(`/users/me/addresses/${deleteTarget.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Error');
			const nextTotal = Math.max(0, totalAddresses - 1);
			const maxPageAfterDelete = Math.max(1, Math.ceil(nextTotal / ITEMS_PER_PAGE));
			const nextPage = Math.min(page, maxPageAfterDelete);
			setPage(nextPage);
			await loadAddresses(nextPage);
			setMessage('Dirección eliminada correctamente.');
			setDeleteTarget(null);
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
				<p className='mt-1 text-sm text-gray-600'>Gestiona tus direcciones de envío guardadas.</p>
				<p className='mt-1 text-xs text-gray-500'>Total de direcciones: {totalAddresses}</p>
			</header>

			<section className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<div className='rounded-2xl border border-gray-200 p-4 lg:col-span-1'>
					<div className='mb-3 flex items-center justify-between'>
						<h2 className='text-lg font-semibold'>Tus direcciones</h2>
						<Button
							size='sm'
							variant='flat'
							startContent={<Plus size={14} />}
							onPress={() => setSelectedAddressId(null)}
						>
							Nueva
						</Button>
					</div>

					{refreshing && <p className='mb-3 text-xs text-gray-500'>Actualizando direcciones...</p>}

					<div className='space-y-2'>
						{addresses.map((address) => (
							<div
								key={address.id}
								className={`rounded-xl border p-3 ${selectedAddressId === address.id ? 'border-black bg-gray-50' : 'border-gray-200'}`}
							>
								<p className='font-semibold'>
									{address.firstName} {address.lastName}
								</p>
								<p className='text-xs text-gray-600'>
									{address.address}, {address.city}
								</p>
								<div className='mt-2 flex items-center gap-2'>
									<Button
										size='sm'
										variant='light'
										startContent={<Pencil size={12} />}
										onPress={() => setSelectedAddressId(address.id)}
									>
										Editar
									</Button>
									<Button
										size='sm'
										variant='light'
										color='danger'
										startContent={<Trash2 size={12} />}
										onPress={() => setDeleteTarget(address)}
									>
										Eliminar
									</Button>
								</div>
							</div>
						))}
					</div>

					{totalAddresses > 0 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
				</div>

				<div className='rounded-2xl border border-gray-200 p-6 lg:col-span-2'>
					<h2 className='mb-4 text-lg font-semibold'>
						{selectedAddress ? 'Editar dirección' : 'Crear nueva dirección'}
					</h2>
					<form key={selectedAddress?.id ?? 'new'} onSubmit={handleSaveAddress} className='flex flex-col gap-4'>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<Input isRequired name='firstName' label='Nombre' defaultValue={selectedAddress?.firstName ?? ''} />
						<Input isRequired name='lastName' label='Apellido' defaultValue={selectedAddress?.lastName ?? ''} />
					</div>
					<Input isRequired name='address' label='Dirección' defaultValue={selectedAddress?.address ?? ''} />
					<Input name='address2' label='Dirección 2 (opcional)' defaultValue={selectedAddress?.address2 ?? ''} />
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
						<Input isRequired name='city' label='Ciudad' defaultValue={selectedAddress?.city ?? ''} />
						<Input
							isRequired
							name='postalCode'
							label='Código postal'
							defaultValue={selectedAddress?.postalCode ?? ''}
						/>
						<Autocomplete
							isRequired
							label='País'
							placeholder='Buscar país'
							selectedKey={countryId || null}
							onSelectionChange={(key) => setCountryId(key ? String(key) : '')}
						>
							{countries.map((country) => (
								<AutocompleteItem key={country.id}>{country.name}</AutocompleteItem>
							))}
						</Autocomplete>
					</div>
					<Input isRequired name='phone' label='Teléfono' defaultValue={selectedAddress?.phone ?? ''} />

					{message && (
						<p
							className={`rounded-lg p-3 text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
						>
							{message}
						</p>
					)}

					<div className='flex flex-wrap gap-3'>
						<Button type='submit' color='primary' isLoading={saving} startContent={<Save size={16} />}>
							{selectedAddress ? 'Guardar cambios' : 'Crear dirección'}
						</Button>
						{selectedAddress && (
							<Button
								type='button'
								color='danger'
								variant='light'
								isLoading={deleting}
								startContent={<Trash2 size={16} />}
								onPress={() => setDeleteTarget(selectedAddress)}
							>
								Eliminar dirección
							</Button>
						)}
					</div>
					</form>
				</div>
			</section>

			<ConfirmDialog
				open={!!deleteTarget}
				title='Eliminar dirección'
				description={`¿Seguro que deseas eliminar la dirección de ${deleteTarget?.firstName ?? ''} ${deleteTarget?.lastName ?? ''}?`}
				confirmLabel='Eliminar'
				cancelLabel='Cancelar'
				variant='danger'
				loading={deleting}
				onConfirm={() => void handleDeleteAddress()}
				onCancel={() => setDeleteTarget(null)}
			/>
		</main>
	);
}
