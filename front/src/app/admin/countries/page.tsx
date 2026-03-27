'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
	AdminPageHeader,
	ConfirmDialog,
	countriesApi,
	DataTable,
	ErrorState,
	FormModal,
	SearchInput,
	StatusBadge,
	type AdminCountry,
	type Column,
} from '@/features/admin';

function formatCurrency(v: number) {
	return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(v);
}

export default function AdminCountriesPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [editCountry, setEditCountry] = useState<AdminCountry | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminCountry | null>(null);

	const {
		data: countries,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['admin', 'countries'],
		queryFn: () => countriesApi.list(),
	});

	const filtered = (countries ?? []).filter(
		(c) =>
			!search ||
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			c.id.toLowerCase().includes(search.toLowerCase()) ||
			(c.isoCode && c.isoCode.toLowerCase().includes(search.toLowerCase())),
	);

	const createMutation = useMutation({
		mutationFn: (d: Record<string, unknown>) => countriesApi.create(d),
		onSuccess: () => {
			toast.success('País creado');
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => countriesApi.update(id, data),
		onSuccess: () => {
			toast.success('País actualizado');
			setEditCountry(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => countriesApi.delete(id),
		onSuccess: () => {
			toast.success('País eliminado');
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const columns: Column<AdminCountry>[] = [
		{
			key: 'name',
			header: 'País',
			render: (c) => (
				<div>
					<p className='font-medium text-gray-900'>{c.name}</p>
					<p className='text-xs text-gray-500'>
						{c.id} {c.isoCode ? `(${c.isoCode})` : ''}
					</p>
				</div>
			),
		},
		{
			key: 'currency',
			header: 'Moneda',
			render: (c) => <span className='font-mono text-sm'>{c.currency}</span>,
		},
		{
			key: 'shipping',
			header: 'Envío',
			render: (c) => (
				<div className='flex flex-col gap-1'>
					<StatusBadge
						value={c.allowsShipping ? 'Envío' : 'Sin envío'}
						variant={c.allowsShipping ? 'green' : 'gray'}
					/>
					{c.allowsShipping && (
						<span className='text-xs text-gray-500'>
							{formatCurrency(c.shippingBaseCost)} · {c.etaDays}d
						</span>
					)}
				</div>
			),
		},
		{
			key: 'purchase',
			header: 'Compra',
			render: (c) => (
				<StatusBadge
					value={c.allowsPurchase ? 'Permitida' : 'No permitida'}
					variant={c.allowsPurchase ? 'green' : 'red'}
				/>
			),
		},
		{
			key: 'status',
			header: 'Estado',
			render: (c) => (
				<StatusBadge value={c.isActive ? 'Activo' : 'Inactivo'} variant={c.isActive ? 'green' : 'gray'} />
			),
		},
		{
			key: 'priority',
			header: 'Prioridad',
			render: (c) => <span className='text-sm font-medium'>{c.priority}</span>,
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (c) => (
				<div className='flex justify-end gap-2'>
					<button
						onClick={() => setEditCountry(c)}
						className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
					>
						Editar
					</button>
					<button
						onClick={() => setDeleteTarget(c)}
						className='rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50'
					>
						Eliminar
					</button>
				</div>
			),
		},
	];

	if (error) {
		return (
			<>
				<AdminPageHeader title='Países' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Países'
				description='Administra los países habilitados para operación y envíos'
				actions={
					<button
						onClick={() => setCreateOpen(true)}
						className='flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800'
					>
						<Plus size={16} /> Nuevo país
					</button>
				}
			/>

			<div className='mb-4'>
				<SearchInput value={search} onChange={setSearch} placeholder='Buscar por nombre o código...' />
			</div>

			<DataTable
				columns={columns}
				data={filtered}
				isLoading={isLoading}
				emptyMessage='No se encontraron países'
			/>

			<CountryFormModal
				open={createOpen}
				title='Crear país'
				loading={createMutation.isPending}
				onClose={() => setCreateOpen(false)}
				onSubmit={(d) => createMutation.mutate(d)}
			/>

			{editCountry && (
				<CountryFormModal
					open
					title='Editar país'
					initialData={editCountry}
					loading={updateMutation.isPending}
					onClose={() => setEditCountry(null)}
					onSubmit={(d) => updateMutation.mutate({ id: editCountry.id, data: d })}
				/>
			)}

			<ConfirmDialog
				open={!!deleteTarget}
				title='Eliminar país'
				description={`¿Eliminar "${deleteTarget?.name}"? Si tiene direcciones asociadas, no se podrá eliminar.`}
				confirmLabel='Eliminar'
				loading={deleteMutation.isPending}
				onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
				onCancel={() => setDeleteTarget(null)}
			/>
		</>
	);
}

function CountryFormModal({
	open,
	title,
	initialData,
	loading,
	onClose,
	onSubmit,
}: {
	open: boolean;
	title: string;
	initialData?: AdminCountry;
	loading: boolean;
	onClose: () => void;
	onSubmit: (data: Record<string, unknown>) => void;
}) {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		onSubmit({
			id: fd.get('id'),
			name: fd.get('name'),
			isoCode: fd.get('isoCode') || undefined,
			currency: fd.get('currency') || 'USD',
			isActive: fd.get('isActive') === 'on',
			allowsShipping: fd.get('allowsShipping') === 'on',
			allowsPurchase: fd.get('allowsPurchase') === 'on',
			shippingBaseCost: Number(fd.get('shippingBaseCost') || 0),
			etaDays: Number(fd.get('etaDays') || 7),
			priority: Number(fd.get('priority') || 0),
		});
	};

	return (
		<FormModal open={open} title={title} onClose={onClose} onSubmit={handleSubmit} loading={loading}>
			<div className='space-y-4'>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>ID (código) *</label>
						<input
							name='id'
							defaultValue={initialData?.id}
							required
							disabled={!!initialData}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black disabled:bg-gray-100'
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>Nombre *</label>
						<input
							name='name'
							defaultValue={initialData?.name}
							required
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>Código ISO</label>
						<input
							name='isoCode'
							defaultValue={initialData?.isoCode ?? ''}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
				</div>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>Moneda</label>
						<input
							name='currency'
							defaultValue={initialData?.currency ?? 'USD'}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>Costo envío base</label>
						<input
							name='shippingBaseCost'
							type='number'
							step='0.01'
							min='0'
							defaultValue={initialData?.shippingBaseCost ?? 0}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>ETA (días)</label>
						<input
							name='etaDays'
							type='number'
							min='0'
							defaultValue={initialData?.etaDays ?? 7}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
				</div>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>Prioridad</label>
						<input
							name='priority'
							type='number'
							min='0'
							defaultValue={initialData?.priority ?? 0}
							className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
						/>
					</div>
				</div>
				<div className='flex flex-wrap gap-6'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							name='isActive'
							defaultChecked={initialData?.isActive ?? true}
							className='rounded border-gray-300'
						/>
						<span className='text-sm font-medium text-gray-700'>Activo</span>
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							name='allowsShipping'
							defaultChecked={initialData?.allowsShipping ?? true}
							className='rounded border-gray-300'
						/>
						<span className='text-sm font-medium text-gray-700'>Permite envío</span>
					</label>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							name='allowsPurchase'
							defaultChecked={initialData?.allowsPurchase ?? true}
							className='rounded border-gray-300'
						/>
						<span className='text-sm font-medium text-gray-700'>Permite compra</span>
					</label>
				</div>
			</div>
		</FormModal>
	);
}
