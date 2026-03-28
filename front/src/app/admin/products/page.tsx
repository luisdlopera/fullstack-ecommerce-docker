'use client';

import { Checkbox, Select, SelectItem } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
	AdminPageHeader,
	categoriesApi,
	canDeleteProduct,
	canManageProductsWrite,
	ConfirmDialog,
	DataTable,
	ErrorState,
	FilterSelect,
	FormModal,
	productsApi,
	SearchInput,
	StatusBadge,
	type AdminCategory,
	type AdminProduct,
	type Column,
} from '@/features/admin';

const GENDER_OPTIONS = [
	{ value: 'men', label: 'Hombre' },
	{ value: 'women', label: 'Mujer' },
	{ value: 'kid', label: 'Niño' },
	{ value: 'unisex', label: 'Unisex' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const STATUS_OPTIONS = [
	{ value: 'true', label: 'Activo' },
	{ value: 'false', label: 'Inactivo' },
];

const STOCK_OPTIONS = [
	{ value: 'true', label: 'Con stock' },
	{ value: 'false', label: 'Sin stock' },
];

function formatCurrency(v: number) {
	return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(v);
}

export default function AdminProductsPage() {
	const { user } = useAuth();
	const role = user?.role ?? 'USER';
	const canWrite = canManageProductsWrite(role);
	const canDelete = canDeleteProduct(role);

	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [stockFilter, setStockFilter] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'products', page, search, categoryFilter, statusFilter, stockFilter],
		queryFn: () =>
			productsApi.list({
				page,
				limit: 20,
				search: search || undefined,
				categoryId: categoryFilter || undefined,
				isActive: statusFilter ? statusFilter === 'true' : undefined,
				inStock: stockFilter ? stockFilter === 'true' : undefined,
			}),
	});

	const { data: categories } = useQuery({
		queryKey: ['admin', 'categories-list'],
		queryFn: () => categoriesApi.list(),
	});

	const createMutation = useMutation({
		mutationFn: (formData: Record<string, unknown>) => productsApi.create(formData),
		onSuccess: () => {
			toast.success('Producto creado');
			setCreateOpen(false);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productsApi.update(id, data),
		onSuccess: () => {
			toast.success('Producto actualizado');
			setEditProduct(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => productsApi.delete(id),
		onSuccess: () => {
			toast.success('Producto eliminado');
			setDeleteTarget(null);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const toggleMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => productsApi.updateStatus(id, isActive),
		onSuccess: () => {
			toast.success('Estado actualizado');
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const columns: Column<AdminProduct>[] = [
		{
			key: 'product',
			header: 'Producto',
			render: (p) => (
				<div className='flex items-center gap-3'>
					{p.ProductImage?.[0]?.url ? (
						<Image
							src={p.ProductImage[0].url}
							alt={p.title}
							width={40}
							height={40}
							className='h-10 w-10 rounded-lg object-cover'
						/>
					) : (
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
							<ImageIcon size={16} className='text-gray-400' />
						</div>
					)}
					<div>
						<p className='font-medium text-gray-900'>{p.title}</p>
						<p className='text-xs text-gray-500'>{p.sku ?? p.slug}</p>
					</div>
				</div>
			),
		},
		{
			key: 'category',
			header: 'Categoría',
			render: (p) => <span className='text-sm'>{p.category.name}</span>,
		},
		{
			key: 'price',
			header: 'Precio',
			render: (p) => (
				<div>
					<span className='font-semibold'>{formatCurrency(p.price)}</span>
					{p.comparePrice && (
						<span className='ml-1 text-xs text-gray-400 line-through'>
							{formatCurrency(p.comparePrice)}
						</span>
					)}
				</div>
			),
		},
		{
			key: 'stock',
			header: 'Stock',
			render: (p) => (
				<StatusBadge
					value={p.inStock > 0 ? `${p.inStock} uds` : 'Agotado'}
					variant={p.inStock > 10 ? 'green' : p.inStock > 0 ? 'yellow' : 'red'}
				/>
			),
		},
		{
			key: 'status',
			header: 'Estado',
			render: (p) =>
				canWrite ? (
					<button type='button' onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}>
						<StatusBadge
							value={p.isActive ? 'Activo' : 'Inactivo'}
							variant={p.isActive ? 'green' : 'gray'}
						/>
					</button>
				) : (
					<StatusBadge value={p.isActive ? 'Activo' : 'Inactivo'} variant={p.isActive ? 'green' : 'gray'} />
				),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (p) => (
				<div className='flex justify-end gap-2'>
					{canWrite && (
						<button
							type='button'
							onClick={() => setEditProduct(p)}
							className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
						>
							Editar
						</button>
					)}
					{canDelete && (
						<button
							type='button'
							onClick={() => setDeleteTarget(p)}
							className='rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50'
						>
							Eliminar
						</button>
					)}
				</div>
			),
		},
	];

	const categoryOptions = (categories ?? []).map((c: AdminCategory) => ({ value: c.id, label: c.name }));

	if (error) {
		return (
			<>
				<AdminPageHeader title='Productos' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Productos'
				description='Administra el catálogo de productos'
				actions={
					canWrite ? (
						<button
							type='button'
							onClick={() => setCreateOpen(true)}
							className='flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800'
						>
							<Plus size={16} /> Nuevo producto
						</button>
					) : undefined
				}
			/>

			<div className='mb-4 flex flex-wrap items-center gap-3'>
				<SearchInput
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder='Buscar por nombre, SKU o ID...'
				/>
				<FilterSelect
					value={categoryFilter}
					onChange={(v) => {
						setCategoryFilter(v);
						setPage(1);
					}}
					options={categoryOptions}
					placeholder='Todas las categorías'
				/>
				<FilterSelect
					value={statusFilter}
					onChange={(v) => {
						setStatusFilter(v);
						setPage(1);
					}}
					options={STATUS_OPTIONS}
					placeholder='Estado'
				/>
				<FilterSelect
					value={stockFilter}
					onChange={(v) => {
						setStockFilter(v);
						setPage(1);
					}}
					options={STOCK_OPTIONS}
					placeholder='Stock'
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				page={page}
				totalPages={data?.meta.totalPages ?? 1}
				total={data?.meta.total}
				onPageChange={setPage}
				isLoading={isLoading}
				emptyMessage='No se encontraron productos'
			/>

			{canWrite && (
				<ProductFormModal
					key={createOpen ? 'product-create-open' : 'product-create-closed'}
					open={createOpen}
					title='Crear producto'
					categories={categories ?? []}
					loading={createMutation.isPending}
					onClose={() => setCreateOpen(false)}
					onSubmit={(d) => createMutation.mutate(d)}
				/>
			)}

			{canWrite && editProduct && (
				<ProductFormModal
					key={editProduct.id}
					open
					title='Editar producto'
					initialData={editProduct}
					categories={categories ?? []}
					loading={updateMutation.isPending}
					onClose={() => setEditProduct(null)}
					onSubmit={(d) => updateMutation.mutate({ id: editProduct.id, data: d })}
				/>
			)}

			<ConfirmDialog
				open={!!deleteTarget && canDelete}
				title='Eliminar producto'
				description={`¿Eliminar "${deleteTarget?.title}"? Se desactivará del catálogo.`}
				confirmLabel='Eliminar'
				loading={deleteMutation.isPending}
				onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
				onCancel={() => setDeleteTarget(null)}
			/>
		</>
	);
}

const CATEGORY_PLACEHOLDER_KEY = '_none';

function ProductFormModal({
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
	initialData?: AdminProduct;
	categories: AdminCategory[];
	loading: boolean;
	onClose: () => void;
	onSubmit: (data: Record<string, unknown>) => void;
}) {
	const [gender, setGender] = useState(initialData?.gender ?? 'unisex');
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
	const [selectedSizes, setSelectedSizes] = useState<string[]>(initialData?.sizes ?? ['S', 'M', 'L']);
	const [featured, setFeatured] = useState(initialData?.featured ?? false);
	const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
	const categoryItems = [
		{ id: CATEGORY_PLACEHOLDER_KEY, name: 'Seleccionar' },
		...categories.map((c) => ({ id: c.id, name: c.name })),
	];

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!categoryId) {
			toast.error('Selecciona una categoría');
			return;
		}
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);

		const data: Record<string, unknown> = {
			title: fd.get('title'),
			description: fd.get('description'),
			slug: fd.get('slug'),
			sku: fd.get('sku') || undefined,
			price: Number(fd.get('price')),
			comparePrice: fd.get('comparePrice') ? Number(fd.get('comparePrice')) : undefined,
			inStock: Number(fd.get('inStock')),
			gender,
			categoryId,
			tags: (fd.get('tags') as string)
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
			sizes: selectedSizes,
			featured,
			isActive,
		};

		const imagesRaw = fd.get('images') as string;
		if (imagesRaw.trim()) {
			data.images = imagesRaw
				.split('\n')
				.map((u) => u.trim())
				.filter(Boolean);
		}

		onSubmit(data);
	};

	const categoryKey = categoryId || CATEGORY_PLACEHOLDER_KEY;

	return (
		<FormModal open={open} title={title} onClose={onClose} onSubmit={handleSubmit} loading={loading} size='lg'>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				<div className='sm:col-span-2'>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Título *</label>
					<input
						name='title'
						defaultValue={initialData?.title}
						key={initialData?.id ?? 'new-title'}
						required
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div className='sm:col-span-2'>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Descripción *</label>
					<textarea
						name='description'
						defaultValue={initialData?.description}
						key={initialData?.id ?? 'new-desc'}
						required
						rows={3}
						className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black'
					/>
				</div>
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Slug *</label>
					<input
						name='slug'
						defaultValue={initialData?.slug}
						key={initialData?.id ?? 'new-slug'}
						required
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>SKU</label>
					<input
						name='sku'
						defaultValue={initialData?.sku ?? ''}
						key={initialData?.id ?? 'new-sku'}
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Precio *</label>
					<input
						name='price'
						type='number'
						step='0.01'
						min='0'
						defaultValue={initialData?.price ?? 0}
						key={initialData?.id ?? 'new-price'}
						required
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Precio comparativo</label>
					<input
						name='comparePrice'
						type='number'
						step='0.01'
						min='0'
						defaultValue={initialData?.comparePrice ?? ''}
						key={initialData?.id ?? 'new-compare'}
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Stock *</label>
					<input
						name='inStock'
						type='number'
						min='0'
						defaultValue={initialData?.inStock ?? 0}
						key={initialData?.id ?? 'new-stock'}
						required
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div className='sm:col-span-2'>
					<Select
						label='Género'
						size='sm'
						variant='bordered'
						selectedKeys={new Set([gender])}
						onSelectionChange={(keys) => {
							const k = Array.from(keys as Set<string>)[0];
							if (k) setGender(String(k));
						}}
					>
						{GENDER_OPTIONS.map((g) => (
							<SelectItem key={g.value} textValue={g.label}>
								{g.label}
							</SelectItem>
						))}
					</Select>
				</div>
				<div className='sm:col-span-2'>
					<Select
						label='Categoría'
						size='sm'
						variant='bordered'
						placeholder='Seleccionar'
						items={categoryItems}
						selectedKeys={new Set([categoryKey])}
						onSelectionChange={(keys) => {
							const k = Array.from(keys as Set<string>)[0];
							setCategoryId(k === CATEGORY_PLACEHOLDER_KEY || !k ? '' : String(k));
						}}
					>
						{(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
					</Select>
				</div>
				<div className='sm:col-span-2'>
					<label className='mb-1 block text-sm font-medium text-gray-700'>Tags</label>
					<input
						name='tags'
						defaultValue={initialData?.tags.join(', ') ?? ''}
						key={initialData?.id ?? 'new-tags'}
						placeholder='tag1, tag2'
						className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'
					/>
				</div>
				<div className='sm:col-span-2'>
					<p className='mb-2 text-sm font-medium text-gray-700'>Tallas</p>
					<div className='flex flex-wrap gap-3'>
						{SIZE_OPTIONS.map((s) => (
							<Checkbox
								key={s}
								size='sm'
								isSelected={selectedSizes.includes(s)}
								onValueChange={(checked) => {
									setSelectedSizes((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)));
								}}
							>
								{s}
							</Checkbox>
						))}
					</div>
				</div>
				<div className='sm:col-span-2'>
					<label className='mb-1 block text-sm font-medium text-gray-700'>
						URLs de imágenes (una por línea)
					</label>
					<textarea
						name='images'
						defaultValue={initialData?.ProductImage.map((i) => i.url).join('\n') ?? ''}
						key={initialData?.id ?? 'new-images'}
						rows={3}
						placeholder='/img/product1.png'
						className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black'
					/>
				</div>
				<div className='flex flex-wrap items-center gap-6 sm:col-span-2'>
					<Checkbox size='sm' isSelected={featured} onValueChange={setFeatured}>
						Destacado
					</Checkbox>
					<Checkbox size='sm' isSelected={isActive} onValueChange={setIsActive}>
						Activo
					</Checkbox>
				</div>
			</div>
		</FormModal>
	);
}
