'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch } from '@heroui/react';
import { Plus, Store, Building2, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
	AdminPageHeader,
	DataTable,
	ErrorState,
	SearchInput,
	 warehousesApi,
	PERMISSIONS,
	StatCard,
	type Column,
	type Warehouse,
} from '@/features/admin';

export default function AdminWarehousesPage() {
	const { hasPermission } = usePermissions();
	const canManage = hasPermission(PERMISSIONS.INVENTORY_ADJUST);
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
	const [formData, setFormData] = useState({ name: '', code: '', location: '' });

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'warehouses', page, search],
		queryFn: () =>
			warehousesApi.list({
				page,
				limit: 20,
				search: search || undefined,
			}),
	});

	const createMutation = useMutation({
		mutationFn: (data: { name: string; code: string; location?: string }) =>
			warehousesApi.create(data),
		onSuccess: () => {
			toast.success('Sucursal creada correctamente');
			setIsModalOpen(false);
			setFormData({ name: '', code: '', location: '' });
			queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { name?: string; code?: string; location?: string; isActive?: boolean } }) =>
			warehousesApi.update(id, data),
		onSuccess: () => {
			toast.success('Sucursal actualizada');
			setIsModalOpen(false);
			setEditingWarehouse(null);
			setFormData({ name: '', code: '', location: '' });
			queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const toggleStatusMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			warehousesApi.update(id, { isActive: isActive as boolean }),
		onSuccess: () => {
			toast.success('Estado actualizado');
			queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const handleOpenModal = (warehouse?: Warehouse) => {
		if (warehouse) {
			setEditingWarehouse(warehouse);
			setFormData({
				name: warehouse.name,
				code: warehouse.code,
				location: warehouse.location || '',
			});
		} else {
			setEditingWarehouse(null);
			setFormData({ name: '', code: '', location: '' });
		}
		setIsModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingWarehouse) {
			updateMutation.mutate({ id: editingWarehouse.id, data: formData });
		} else {
			createMutation.mutate(formData);
		}
	};

	const columns: Column<Warehouse>[] = [
		{
			key: 'name',
			header: 'Sucursal',
			render: (w) => (
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
						<Store size={18} className='text-blue-600' />
					</div>
					<div>
						<p className='font-medium text-gray-900'>{w.name}</p>
						<p className='text-xs text-gray-500'>Código: {w.code}</p>
					</div>
				</div>
			),
		},
		{
			key: 'location',
			header: 'Ubicación',
			render: (w) => (
				<div className='flex items-center gap-2 text-sm text-gray-600'>
					<MapPin size={14} />
					{w.location || 'Sin ubicación'}
				</div>
			),
		},
		{
			key: 'inventory',
			header: 'Inventario',
			render: (w) => (
				<div className='flex items-center gap-2'>
					<Package size={14} className='text-gray-400' />
					<span className='text-sm'>{w.inventoryCount} productos</span>
				</div>
			),
		},
		{
			key: 'status',
			header: 'Estado',
			render: (w) =>
				canManage ? (
					<Switch
						size='sm'
						isSelected={w.isActive}
						onValueChange={(checked) =>
							toggleStatusMutation.mutate({ id: w.id, isActive: checked })
						}
					>
						<span className={w.isActive ? 'text-green-600' : 'text-gray-400'}>
							{w.isActive ? 'Activa' : 'Inactiva'}
						</span>
					</Switch>
				) : (
					<Chip size='sm' color={w.isActive ? 'success' : 'default'} variant='flat'>
						{w.isActive ? 'Activa' : 'Inactiva'}
					</Chip>
				),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (w) =>
				canManage && (
					<button
						type='button'
						onClick={() => handleOpenModal(w)}
						className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
					>
						Editar
					</button>
				),
		},
	];

	if (error) {
		return (
			<>
				<AdminPageHeader title='Sucursales' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Sucursales'
				description='Gestiona tus ubicaciones de inventario'
				actions={
					canManage ? (
						<Button
							color='primary'
							onPress={() => handleOpenModal()}
							startContent={<Plus size={16} />}
						>
							Nueva Sucursal
						</Button>
					) : undefined
				}
			/>

			<div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
				<StatCard
					title='Total Sucursales'
					value={data?.meta.total ?? 0}
					icon={Building2}
				/>
				<StatCard
					title='Sucursales Activas'
					value={data?.data.filter((w) => w.isActive).length ?? 0}
					icon={Store}
				/>
				<StatCard
					title='Total Inventario'
					value={data?.data.reduce((acc, w) => acc + w.inventoryCount, 0) ?? 0}
					icon={Package}
				/>
			</div>

			<div className='mb-4'>
				<SearchInput
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder='Buscar por nombre, código o ubicación...'
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				paginationMeta={data?.meta}
				onPaginationChange={(p) => setPage(p.page)}
				isLoading={isLoading}
				emptyMessage='No se encontraron sucursales'
				rowKey={(w) => w.id}
			/>

			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size='md'>
				<ModalContent>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							{editingWarehouse ? 'Editar Sucursal' : 'Nueva Sucursal'}
						</ModalHeader>
						<ModalBody className='gap-4'>
							<Input
								label='Nombre'
								placeholder='Ej: Sucursal Centro'
								value={formData.name}
								onValueChange={(v) => setFormData((d) => ({ ...d, name: v }))}
								isRequired
							/>
							<Input
								label='Código'
								placeholder='Ej: CENTRO-01'
								value={formData.code}
								onValueChange={(v) => setFormData((d) => ({ ...d, code: v.toUpperCase() }))}
								isRequired
								description='Código único de identificación'
								isDisabled={!!editingWarehouse}
							/>
							<Input
								label='Ubicación'
								placeholder='Ej: Calle 123 #45-67, Bogotá'
								value={formData.location}
								onValueChange={(v) => setFormData((d) => ({ ...d, location: v }))}
							/>
						</ModalBody>
						<ModalFooter>
							<Button variant='flat' onPress={() => setIsModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								color='primary'
								type='submit'
								isLoading={
									createMutation.isPending || updateMutation.isPending
								}
								isDisabled={!formData.name || !formData.code}
							>
								{editingWarehouse ? 'Guardar Cambios' : 'Crear Sucursal'}
							</Button>
						</ModalFooter>
					</form>
				</ModalContent>
			</Modal>
		</>
	);
}
