'use client';

import { Input, Select, SelectItem, Textarea } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
	AdminPageHeader,
	categoriesApi,
	ConfirmDialog,
	DataTable,
	ErrorState,
	FormModal,
	StatusBadge,
	type AdminCategory,
	type Column,
} from '@/features/admin';

export default function AdminCategoriesPage() {
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

	const {
		data: categories,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['admin', 'categories'],
		queryFn: () => categoriesApi.list(),
	});

	const createMutation = useMutation({
		mutationFn: (d: Record<string, unknown>) => categoriesApi.create(d),
		onSuccess: () => {
			toast.success('Categoría creada');
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => categoriesApi.update(id, data),
		onSuccess: () => {
			toast.success('Categoría actualizada');
			setEditCategory(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => categoriesApi.delete(id),
		onSuccess: () => {
			toast.success('Categoría eliminada');
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const columns: Column<AdminCategory>[] = [
		{
			key: 'name',
			header: 'Nombre',
			render: (c) => (
				<div className='flex items-center gap-2'>
					{c.parentId && <span className='text-gray-400'>↳</span>}
					<div>
						<p className='font-medium text-gray-900'>{c.name}</p>
						<p className='text-xs text-gray-500'>{c.slug}</p>
					</div>
				</div>
			),
		},
		{
			key: 'parent',
			header: 'Padre',
			render: (c) => <span className='text-sm'>{c.parent?.name ?? '—'}</span>,
		},
		{
			key: 'products',
			header: 'Productos',
			render: (c) => <span className='text-sm font-medium'>{c._count?.Product ?? 0}</span>,
		},
		{
			key: 'order',
			header: 'Orden',
			render: (c) => <span className='text-sm'>{c.sortOrder}</span>,
		},
		{
			key: 'status',
			header: 'Estado',
			render: (c) => (
				<StatusBadge value={c.isActive ? 'Activa' : 'Inactiva'} variant={c.isActive ? 'green' : 'gray'} />
			),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (c) => (
				<div className='flex justify-end gap-2'>
					<button
						onClick={() => setEditCategory(c)}
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
				<AdminPageHeader title='Categorías' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Categorías'
				description='Organiza los productos del catálogo'
				actions={
					<button
						onClick={() => setCreateOpen(true)}
						className='flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800'
					>
						<Plus size={16} /> Nueva categoría
					</button>
				}
			/>

			<DataTable
				columns={columns}
				data={categories ?? []}
				isLoading={isLoading}
				emptyMessage='No hay categorías registradas'
			/>

			<CategoryFormModal
				open={createOpen}
				title='Crear categoría'
				categories={categories ?? []}
				loading={createMutation.isPending}
				onClose={() => setCreateOpen(false)}
				onSubmit={(d) => createMutation.mutate(d)}
			/>

			{editCategory && (
				<CategoryFormModal
					open
					title='Editar categoría'
					initialData={editCategory}
					categories={(categories ?? []).filter((c) => c.id !== editCategory.id)}
					loading={updateMutation.isPending}
					onClose={() => setEditCategory(null)}
					onSubmit={(d) => updateMutation.mutate({ id: editCategory.id, data: d })}
				/>
			)}

			<ConfirmDialog
				open={!!deleteTarget}
				title='Eliminar categoría'
				description={
					(deleteTarget?._count?.Product ?? 0) > 0
						? `"${deleteTarget?.name}" tiene ${deleteTarget?._count?.Product} productos asociados. No se puede eliminar.`
						: `¿Eliminar "${deleteTarget?.name}"?`
				}
				confirmLabel='Eliminar'
				loading={deleteMutation.isPending}
				onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
				onCancel={() => setDeleteTarget(null)}
			/>
		</>
	);
}

function CategoryFormModal({
	open,
	title,
	initialData,
	categories,
	loading,
	onClose,
	onSubmit,
}: {
	open: boolean;
	title: string;
	initialData?: AdminCategory;
	categories: AdminCategory[];
	loading: boolean;
	onClose: () => void;
	onSubmit: (data: Record<string, unknown>) => void;
}) {
	const NONE_PARENT_KEY = '__none_parent__';

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const rawParentId = String(fd.get('parentId') ?? '');
		onSubmit({
			name: fd.get('name'),
			slug: fd.get('slug'),
			description: fd.get('description') || undefined,
			image: fd.get('image') || undefined,
			parentId: rawParentId && rawParentId !== NONE_PARENT_KEY ? rawParentId : undefined,
			sortOrder: Number(fd.get('sortOrder') || 0),
			isActive: fd.get('isActive') !== 'off',
		});
	};

	const parentIdValue = initialData?.parentId ?? NONE_PARENT_KEY;
	const defaultParentKeys = new Set([parentIdValue]);
	const parentItems = [{ id: NONE_PARENT_KEY, name: 'Ninguna' }, ...categories.map((c) => ({ id: c.id, name: c.name }))];

	return (
		<FormModal open={open} title={title} onClose={onClose} onSubmit={handleSubmit} loading={loading}>
			<div className='space-y-4'>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					<Input
						label='Nombre *'
						name='name'
						defaultValue={initialData?.name}
						required
						variant='flat'
						radius='lg'
						size='sm'
					/>
					<Input
						label='Slug *'
						name='slug'
						defaultValue={initialData?.slug}
						required
						variant='flat'
						radius='lg'
						size='sm'
					/>
				</div>
				<Textarea
					label='Descripción'
					name='description'
					defaultValue={initialData?.description ?? ''}
					rows={2}
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
					<Select
						label='Categoría padre'
						name='parentId'
						defaultSelectedKeys={defaultParentKeys}
						items={parentItems}
						variant='flat'
						radius='lg'
						size='sm'
					>
						{(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
					</Select>
					<Input
						label='Orden'
						name='sortOrder'
						type='number'
						min='0'
						defaultValue={String(initialData?.sortOrder ?? 0)}
						variant='flat'
						radius='lg'
						size='sm'
					/>
					<Input
						label='Imagen URL'
						name='image'
						defaultValue={initialData?.image ?? ''}
						variant='flat'
						radius='lg'
						size='sm'
					/>
				</div>
			</div>
		</FormModal>
	);
}
