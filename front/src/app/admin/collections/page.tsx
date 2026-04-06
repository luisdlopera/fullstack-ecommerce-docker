'use client';

import { useState } from 'react';
import {
	Button,
	Card,
	CardBody,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	Switch,
	Textarea,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Layers, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
	AdminPageHeader,
	DataTable,
	ErrorState,
	PERMISSIONS,
	SearchInput,
	StatusBadge,
	type Column,
} from '@/features/admin';
import { collectionsApi } from '@/features/admin/services/collections-api';
import type { Collection } from '@/features/admin/types/collection';

const GENDER_OPTIONS = [
	{ value: 'men', label: 'Hombres' },
	{ value: 'women', label: 'Mujeres' },
	{ value: 'kid', label: 'Niños' },
	{ value: 'unisex', label: 'Unisex' },
];

export default function AdminCollectionsPage() {
	const { hasPermission } = usePermissions();
	const canManage = hasPermission(PERMISSIONS.CATEGORIES_CREATE) || hasPermission(PERMISSIONS.CATEGORIES_UPDATE);
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [selectedGender, setSelectedGender] = useState<string>('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
	const [formData, setFormData] = useState<{
		name: string;
		slug: string;
		description: string;
		gender: 'men' | 'women' | 'kid' | 'unisex';
		image: string;
		isActive: boolean;
		sortOrder: number;
	}>({
		name: '',
		slug: '',
		description: '',
		gender: 'men',
		image: '',
		isActive: true,
		sortOrder: 0,
	});

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'collections', page, search, selectedGender],
		queryFn: () =>
			collectionsApi.list({
				page,
				limit: 20,
				search: search || undefined,
				gender: selectedGender || undefined,
			}),
	});

	const createMutation = useMutation<Collection, Error, Record<string, unknown>>({
		mutationFn: collectionsApi.create,
		onSuccess: () => {
			toast.success('Colección creada exitosamente');
			setIsModalOpen(false);
			resetForm();
			queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => collectionsApi.update(id, data),
		onSuccess: () => {
			toast.success('Colección actualizada exitosamente');
			setIsModalOpen(false);
			setEditingCollection(null);
			resetForm();
			queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: collectionsApi.delete,
		onSuccess: () => {
			toast.success('Colección eliminada exitosamente');
			queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const resetForm = () => {
		setFormData({
			name: '',
			slug: '',
			description: '',
			gender: 'men',
			image: '',
			isActive: true,
			sortOrder: 0,
		});
	};

	const handleEdit = (collection: Collection) => {
		setEditingCollection(collection);
		setFormData({
			name: collection.name,
			slug: collection.slug,
			description: collection.description || '',
			gender: collection.gender,
			image: collection.image || '',
			isActive: collection.isActive,
			sortOrder: collection.sortOrder,
		});
		setIsModalOpen(true);
	};

	const handleCreate = () => {
		setEditingCollection(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleSubmit = () => {
		if (!formData.name || !formData.slug) {
			toast.error('Nombre y slug son requeridos');
			return;
		}

		if (editingCollection) {
			updateMutation.mutate({ id: editingCollection.id, data: formData as Record<string, unknown> });
		} else {
			createMutation.mutate(formData as Record<string, unknown>);
		}
	};

	const generateSlug = (name: string) => {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	};

	const columns: Column<Collection>[] = [
		{
			key: 'name',
			header: 'Colección',
			render: (item) => (
				<div className='flex items-center gap-3'>
					{item.image ? (
						<Image
							src={item.image}
							alt={item.name}
							width={40}
							height={40}
							className='h-10 w-10 rounded-lg object-cover'
						/>
					) : (
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
							<Layers size={18} className='text-gray-400' />
						</div>
					)}
					<div>
						<p className='text-sm font-medium text-gray-900'>{item.name}</p>
						<p className='text-xs text-gray-500'>{item.slug}</p>
					</div>
				</div>
			),
		},
		{
			key: 'gender',
			header: 'Género',
			render: (item) => (
				<Chip
					size='sm'
					variant='flat'
					color={
						item.gender === 'men'
							? 'primary'
							: item.gender === 'women'
								? 'danger'
								: item.gender === 'kid'
									? 'warning'
									: 'default'
					}
				>
					{GENDER_OPTIONS.find((g) => g.value === item.gender)?.label || item.gender}
				</Chip>
			),
		},
		{
			key: 'products',
			header: 'Productos',
			render: (item) => <span className='text-sm text-gray-600'>{item._count?.products || 0} productos</span>,
		},
		{
			key: 'status',
			header: 'Estado',
			render: (item) => (
				<StatusBadge value={item.isActive ? 'Activa' : 'Inactiva'} variant={item.isActive ? 'green' : 'gray'} />
			),
		},
		{
			key: 'sortOrder',
			header: 'Orden',
			render: (item) => <span className='text-sm text-gray-500'>{item.sortOrder}</span>,
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (item) => (
				<div className='flex justify-end gap-2'>
					{canManage && (
						<>
							<button
								type='button'
								onClick={() => handleEdit(item)}
								className='rounded-lg p-2 text-gray-600 hover:bg-gray-100'
								title='Editar'
							>
								<Edit2 size={16} />
							</button>
							<button
								type='button'
								onClick={() => {
									if (confirm(`¿Estás seguro de eliminar la colección "${item.name}"?`)) {
										deleteMutation.mutate(item.id);
									}
								}}
								className='rounded-lg p-2 text-red-600 hover:bg-red-50'
								title='Eliminar'
							>
								<Trash2 size={16} />
							</button>
						</>
					)}
				</div>
			),
		},
	];

	if (error) {
		return (
			<>
				<AdminPageHeader title='Colecciones' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Colecciones'
				description='Gestiona las colecciones de tu tienda (Men, Women, Kids, etc.)'
				actions={
					canManage ? (
						<Button color='primary' onPress={handleCreate} startContent={<Plus size={18} />}>
							Nueva Colección
						</Button>
					) : undefined
				}
			/>

			<Card className='mb-4'>
				<CardBody>
					<div className='flex flex-wrap items-center gap-3'>
						<SearchInput
							value={search}
							onChange={(v) => {
								setSearch(v);
								setPage(1);
							}}
							placeholder='Buscar colecciones...'
						/>
						<Select
							size='sm'
							variant='flat'
							className='w-full sm:w-40'
							placeholder='Filtrar por género'
							selectedKeys={selectedGender ? new Set([selectedGender]) : new Set()}
							onSelectionChange={(keys) => {
								const value = Array.from(keys as Set<string>)[0] || '';
								setSelectedGender(value);
								setPage(1);
							}}
						>
							<>
								<SelectItem key=''>Todos los géneros</SelectItem>
								{GENDER_OPTIONS.map((opt) => (
									<SelectItem key={opt.value}>{opt.label}</SelectItem>
								))}
							</>
						</Select>
					</div>
				</CardBody>
			</Card>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				page={page}
				totalPages={data?.meta.totalPages ?? 1}
				total={data?.meta.total}
				onPageChange={setPage}
				isLoading={isLoading}
				emptyMessage='No se encontraron colecciones'
			/>

			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size='lg'>
				<ModalContent>
					<ModalHeader className='flex flex-col gap-1'>
						<span className='text-lg font-semibold'>
							{editingCollection ? 'Editar Colección' : 'Nueva Colección'}
						</span>
					</ModalHeader>
					<ModalBody>
						<div className='grid gap-4'>
							<Input
								label='Nombre'
								placeholder='Ej: Colección Hombres 2024'
								value={formData.name}
								onValueChange={(v) =>
									setFormData((prev) => ({
										...prev,
										name: v,
										slug: editingCollection ? prev.slug : generateSlug(v),
									}))
								}
								isRequired
								variant='flat'
								radius='lg'
							/>
							<Input
								label='Slug'
								placeholder='Ej: men-collection-2024'
								value={formData.slug}
								onValueChange={(v) => setFormData((prev) => ({ ...prev, slug: v }))}
								isRequired
								variant='flat'
								radius='lg'
								description='Identificador único para URLs'
							/>
							<Select
								label='Género'
								selectedKeys={new Set([formData.gender])}
								onSelectionChange={(keys) => {
									const value = Array.from(keys as Set<string>)[0] as
										| 'men'
										| 'women'
										| 'kid'
										| 'unisex';
									setFormData((prev) => ({
										...prev,
										gender: value as 'men' | 'women' | 'kid' | 'unisex',
									}));
								}}
								isRequired
								variant='flat'
								radius='lg'
							>
								{GENDER_OPTIONS.map((opt) => (
									<SelectItem key={opt.value}>{opt.label}</SelectItem>
								))}
							</Select>
							<Textarea
								label='Descripción'
								placeholder='Descripción de la colección...'
								value={formData.description}
								onValueChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
								variant='flat'
								radius='lg'
								minRows={2}
							/>
							<Input
								label='URL de imagen'
								placeholder='https://...'
								value={formData.image}
								onValueChange={(v) => setFormData((prev) => ({ ...prev, image: v }))}
								variant='flat'
								radius='lg'
							/>
							<div className='flex items-center gap-4'>
								<Input
									label='Orden de visualización'
									type='number'
									value={String(formData.sortOrder)}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, sortOrder: parseInt(v) || 0 }))
									}
									variant='flat'
									radius='lg'
									className='w-32'
								/>
								<div className='flex items-center gap-2 pt-6'>
									<Switch
										isSelected={formData.isActive}
										onValueChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
									/>
									<span className='text-sm'>Activa</span>
								</div>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button variant='flat' onPress={() => setIsModalOpen(false)}>
							Cancelar
						</Button>
						<Button
							color='primary'
							onPress={handleSubmit}
							isLoading={createMutation.isPending || updateMutation.isPending}
							isDisabled={!formData.name || !formData.slug}
						>
							{editingCollection ? 'Guardar cambios' : 'Crear colección'}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
