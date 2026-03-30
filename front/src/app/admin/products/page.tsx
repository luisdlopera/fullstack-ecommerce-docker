'use client';

import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Checkbox,
	Chip,
	Input,
	Progress,
	Select,
	SelectItem,
	Textarea,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Dispatch, type SetStateAction, useState } from 'react';
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

type UploadTaskState = {
	active: boolean;
	total: number;
	completed: number;
	currentFileName: string | null;
	failedCount: number;
};

type PendingRetryUploads = {
	productId: string;
	files: File[];
};

const EMPTY_UPLOAD_TASK: UploadTaskState = {
	active: false,
	total: 0,
	completed: 0,
	currentFileName: null,
	failedCount: 0,
};

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
	const [createUploadTask, setCreateUploadTask] = useState<UploadTaskState>(EMPTY_UPLOAD_TASK);
	const [editUploadTask, setEditUploadTask] = useState<UploadTaskState>(EMPTY_UPLOAD_TASK);
	const [pendingRetryUploads, setPendingRetryUploads] = useState<PendingRetryUploads | null>(null);

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

	const runUploadFiles = async ({
		productId,
		files,
		makePrimary,
		setTask,
	}: {
		productId: string;
		files: File[];
		makePrimary: boolean;
		setTask: Dispatch<SetStateAction<UploadTaskState>>;
	}) => {
		const failedFiles: File[] = [];
		setTask({
			active: true,
			total: files.length,
			completed: 0,
			currentFileName: files[0]?.name ?? null,
			failedCount: 0,
		});

		for (let index = 0; index < files.length; index += 1) {
			const file = files[index];
			setTask((prev) => ({ ...prev, currentFileName: file.name }));
			try {
				const shouldBePrimary = makePrimary && index === 0;
				await productsApi.uploadImage(productId, file, shouldBePrimary);
			} catch {
				failedFiles.push(file);
			}
			setTask((prev) => ({
				...prev,
				completed: index + 1,
				failedCount: failedFiles.length,
			}));
		}

		setTask((prev) => ({ ...prev, active: false, currentFileName: null }));
		return failedFiles;
	};

	const createMutation = useMutation({
		mutationFn: async ({
			data,
			uploadFiles,
			makePrimary,
		}: {
			data: Record<string, unknown>;
			uploadFiles?: File[];
			makePrimary?: boolean;
		}) => {
			setCreateUploadTask(EMPTY_UPLOAD_TASK);
			const product = await productsApi.create(data);
			if (uploadFiles && uploadFiles.length > 0) {
				const failedFiles = await runUploadFiles({
					productId: product.id,
					files: uploadFiles,
					makePrimary: makePrimary === true,
					setTask: setCreateUploadTask,
				});

				const freshProduct = await productsApi.getById(product.id);
				return { product: freshProduct, failedFiles };
			}
			return { product, failedFiles: [] as File[] };
		},
		onSuccess: ({ product, failedFiles }) => {
			if (failedFiles.length > 0) {
				toast.error(`Producto creado, pero ${failedFiles.length} imagen(es) fallaron. Puedes reintentar.`);
				setPendingRetryUploads({ productId: product.id, files: failedFiles });
				setCreateOpen(false);
				setEditProduct(product);
			} else {
				toast.success('Producto creado');
				setPendingRetryUploads(null);
				setCreateOpen(false);
			}
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => {
			setCreateUploadTask(EMPTY_UPLOAD_TASK);
			toast.error(err.message);
		},
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

	const uploadImageMutation = useMutation({
		mutationFn: async ({
			productId,
			files,
			makePrimary,
		}: {
			productId: string;
			files: File[];
			makePrimary: boolean;
		}) => {
			const failedFiles = await runUploadFiles({
				productId,
				files,
				makePrimary,
				setTask: setEditUploadTask,
			});
			if (failedFiles.length > 0) {
				throw new Error(`${failedFiles.length} imagen(es) no se pudieron subir`);
			}
			return productsApi.getById(productId);
		},
		onSuccess: (product) => {
			toast.success('Imagen subida');
			setEditProduct(product);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const retryFailedUploadsMutation = useMutation({
		mutationFn: async ({ productId, files }: { productId: string; files: File[] }) => {
			const failedFiles = await runUploadFiles({
				productId,
				files,
				makePrimary: false,
				setTask: setEditUploadTask,
			});
			const product = await productsApi.getById(productId);
			return { product, failedFiles };
		},
		onSuccess: ({ product, failedFiles }) => {
			setEditProduct(product);
			if (failedFiles.length > 0) {
				setPendingRetryUploads({ productId: product.id, files: failedFiles });
				toast.error(`Aun fallan ${failedFiles.length} imagen(es)`);
			} else {
				setPendingRetryUploads(null);
				toast.success('Reintento completado');
			}
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteImageMutation = useMutation({
		mutationFn: async ({ productId, imageId }: { productId: string; imageId: number }) => {
			await productsApi.deleteImage(productId, imageId);
			return productsApi.getById(productId);
		},
		onSuccess: (product) => {
			toast.success('Imagen eliminada');
			setEditProduct(product);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const reorderImagesMutation = useMutation({
		mutationFn: async ({ productId, imageIds }: { productId: string; imageIds: number[] }) => {
			await productsApi.reorderImages(productId, imageIds);
			return productsApi.getById(productId);
		},
		onSuccess: (product) => {
			toast.success('Orden de imágenes actualizado');
			setEditProduct(product);
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const setPrimaryImageMutation = useMutation({
		mutationFn: async ({ productId, imageId }: { productId: string; imageId: number }) => {
			await productsApi.setPrimaryImage(productId, imageId);
			return productsApi.getById(productId);
		},
		onSuccess: (product) => {
			toast.success('Imagen principal actualizada');
			setEditProduct(product);
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
					uploadTask={createUploadTask}
					onClose={() => setCreateOpen(false)}
					onSubmit={(data, uploadContext) =>
						createMutation.mutate({
							data,
							uploadFiles: uploadContext?.files,
							makePrimary: uploadContext?.makePrimary,
						})
					}
				/>
			)}

			{canWrite && editProduct && (
				<ProductFormModal
					key={`${editProduct.id}-img-${(editProduct.ProductImage ?? []).map((i) => `${i.id}:${i.sortOrder}:${i.isPrimary ? 1 : 0}`).join('|')}`}
					open
					title='Editar producto'
					initialData={editProduct}
					categories={categories ?? []}
					loading={updateMutation.isPending}
					uploadingImage={uploadImageMutation.isPending}
					deletingImage={deleteImageMutation.isPending}
					reorderingImages={reorderImagesMutation.isPending}
					settingPrimaryImage={setPrimaryImageMutation.isPending}
					uploadTask={editUploadTask}
					pendingRetryFiles={
						pendingRetryUploads?.productId === editProduct.id ? pendingRetryUploads.files : undefined
					}
					onClose={() => setEditProduct(null)}
					onUploadImage={(productId, files, makePrimary) =>
						uploadImageMutation.mutateAsync({ productId, files, makePrimary })
					}
					onDeleteImage={(productId, imageId) => deleteImageMutation.mutateAsync({ productId, imageId })}
					onReorderImages={(productId, imageIds) =>
						reorderImagesMutation.mutateAsync({ productId, imageIds })
					}
					onSetPrimaryImage={(productId, imageId) =>
						setPrimaryImageMutation.mutateAsync({ productId, imageId })
					}
					onRetryFailedUploads={(productId, files) =>
						retryFailedUploadsMutation.mutateAsync({ productId, files })
					}
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

type ProductImageItem = NonNullable<AdminProduct['ProductImage']>[number];

function ProductFormModal({
	open,
	title,
	initialData,
	categories,
	loading,
	uploadingImage,
	deletingImage,
	reorderingImages,
	settingPrimaryImage,
	uploadTask,
	pendingRetryFiles,
	onClose,
	onUploadImage,
	onDeleteImage,
	onReorderImages,
	onSetPrimaryImage,
	onRetryFailedUploads,
	onSubmit,
}: {
	open: boolean;
	title: string;
	initialData?: AdminProduct;
	categories: AdminCategory[];
	loading: boolean;
	uploadingImage?: boolean;
	deletingImage?: boolean;
	reorderingImages?: boolean;
	settingPrimaryImage?: boolean;
	uploadTask?: UploadTaskState;
	pendingRetryFiles?: File[];
	onClose: () => void;
	onUploadImage?: (productId: string, files: File[], makePrimary: boolean) => Promise<unknown>;
	onDeleteImage?: (productId: string, imageId: number) => Promise<unknown>;
	onReorderImages?: (productId: string, imageIds: number[]) => Promise<unknown>;
	onSetPrimaryImage?: (productId: string, imageId: number) => Promise<unknown>;
	onRetryFailedUploads?: (productId: string, files: File[]) => Promise<unknown>;
	onSubmit: (data: Record<string, unknown>, uploadContext?: { files: File[]; makePrimary: boolean }) => void;
}) {
	const [gender, setGender] = useState(initialData?.gender ?? 'unisex');
	const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
	const [selectedSizes, setSelectedSizes] = useState<string[]>(initialData?.sizes ?? ['S', 'M', 'L']);
	const [featured, setFeatured] = useState(initialData?.featured ?? false);
	const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
	const [uploadFiles, setUploadFiles] = useState<File[]>([]);
	const [makePrimaryUpload, setMakePrimaryUpload] = useState(false);
	const [localImages, setLocalImages] = useState<ProductImageItem[]>(initialData?.ProductImage ?? []);
	const [dragImageId, setDragImageId] = useState<number | null>(null);
	const [pendingDeleteImageId, setPendingDeleteImageId] = useState<number | null>(null);
	const categoryItems = [
		{ id: CATEGORY_PLACEHOLDER_KEY, name: 'Seleccionar' },
		...categories.map((c) => ({ id: c.id, name: c.name })),
	];

	const handleUploadImage = async () => {
		if (!initialData?.id) {
			toast.error('Guarda el producto antes de subir imágenes');
			return;
		}
		if (uploadFiles.length === 0) {
			toast.error('Selecciona al menos un archivo');
			return;
		}
		if (!onUploadImage) return;

		await onUploadImage(initialData.id, uploadFiles, makePrimaryUpload);
		setUploadFiles([]);
		setMakePrimaryUpload(false);
	};

	const handleDeleteImage = async (imageId: number) => {
		if (!initialData?.id || !onDeleteImage) return;
		await onDeleteImage(initialData.id, imageId);
	};

	const handleConfirmDeleteImage = async () => {
		if (pendingDeleteImageId == null) return;
		await handleDeleteImage(pendingDeleteImageId);
		setPendingDeleteImageId(null);
	};

	const handleSetPrimaryImage = async (imageId: number) => {
		if (!initialData?.id || !onSetPrimaryImage) return;
		await onSetPrimaryImage(initialData.id, imageId);
	};

	const handleRetryFailedUploads = async () => {
		if (!initialData?.id || !onRetryFailedUploads || !pendingRetryFiles || pendingRetryFiles.length === 0) return;
		await onRetryFailedUploads(initialData.id, pendingRetryFiles);
	};

	const reorderLocally = (sourceId: number, targetId: number): ProductImageItem[] => {
		const current = [...localImages];
		const sourceIndex = current.findIndex((image) => image.id === sourceId);
		const targetIndex = current.findIndex((image) => image.id === targetId);
		if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
			return current;
		}
		const [moved] = current.splice(sourceIndex, 1);
		current.splice(targetIndex, 0, moved);
		return current.map((image, index) => ({ ...image, sortOrder: index }));
	};

	const handleDropOnImage = async (targetId: number) => {
		if (!initialData?.id || !onReorderImages || dragImageId == null) return;
		if (dragImageId === targetId) {
			setDragImageId(null);
			return;
		}

		const reordered = reorderLocally(dragImageId, targetId);
		setLocalImages(reordered);
		setDragImageId(null);
		await onReorderImages(
			initialData.id,
			reordered.map((image) => image.id),
		);
	};

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

		onSubmit(data, { files: uploadFiles, makePrimary: makePrimaryUpload });
	};

	const categoryKey = categoryId || CATEGORY_PLACEHOLDER_KEY;

	return (
		<>
			<FormModal open={open} title={title} onClose={onClose} onSubmit={handleSubmit} loading={loading} size='lg'>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				{(initialData?.id || !initialData) && (
					<div className='sm:col-span-2 rounded-xl border border-gray-200 p-4'>
						<p className='mb-3 text-sm font-semibold text-gray-900'>Imágenes del producto</p>
						{initialData?.id && <p className='mb-2 text-xs text-gray-500'>Arrastra para reordenar</p>}
						{initialData?.id && (
							<div className='mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
								{localImages.map((img) => (
								<div
									key={img.id}
									draggable={!reorderingImages}
									onDragStart={() => setDragImageId(img.id)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => void handleDropOnImage(img.id)}
									className={`rounded-lg border p-2 ${dragImageId === img.id ? 'border-black' : 'border-gray-200'}`}
								>
									<div className='relative h-24 w-full overflow-hidden rounded-md bg-gray-100'>
										<Image
											src={img.url}
											alt={initialData.title}
											fill
											className='object-cover'
										/>
									</div>
									<div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
										{img.isPrimary ? (
											<span className='rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white'>
												Principal
											</span>
										) : (
											<span className='text-[10px] text-gray-500'>Orden {img.sortOrder + 1}</span>
										)}
										{!img.isPrimary && (
											<button
												type='button'
												disabled={settingPrimaryImage}
												onClick={() => void handleSetPrimaryImage(img.id)}
												className='rounded px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50'
											>
												Hacer principal
											</button>
										)}
										<button
											type='button'
											disabled={deletingImage}
											onClick={() => setPendingDeleteImageId(img.id)}
											className='rounded px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50'
										>
											Borrar
										</button>
									</div>
								</div>
								))}
							</div>
						)}
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => {
								e.preventDefault();
								const dropped = Array.from(e.dataTransfer.files || []).filter((file) =>
									['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
								);
								if (dropped.length === 0) {
									toast.error('Solo se permiten imágenes jpg, jpeg, png o webp');
									return;
								}
								setUploadFiles((prev) => [...prev, ...dropped]);
							}}
							className='mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-xs text-gray-600'
						>
							Arrastra y suelta imágenes aquí o usa el selector
						</div>
						<div className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
							<div>
								<Input
									label='Subir nuevas imágenes'
									name='uploadImages'
									type='file'
									multiple
									accept='image/jpeg,image/jpg,image/png,image/webp'
									onChange={(e) => {
										const files = Array.from(e.target.files ?? []);
										setUploadFiles(files);
									}}
									variant='flat'
									radius='lg'
									size='sm'
								/>
								{uploadFiles.length > 0 && (
									<p className='mt-1 text-xs text-gray-600'>{uploadFiles.length} archivo(s) seleccionado(s)</p>
								)}
								<Checkbox
									size='sm'
									isSelected={makePrimaryUpload}
									onValueChange={setMakePrimaryUpload}
									className='mt-2'
								>
									<span className='text-xs text-gray-600'>Marcar como imagen principal</span>
								</Checkbox>
								{!initialData?.id && uploadFiles.length > 0 && (
									<p className='mt-1 text-xs text-blue-700'>
										Las imágenes se subirán automáticamente al crear el producto.
									</p>
								)}
							</div>
							{initialData?.id ? (
								<Button
									type='button'
									isDisabled={uploadFiles.length === 0 || uploadingImage}
									onPress={() => void handleUploadImage()}
									variant='solid'
									color='default'
								>
									{uploadingImage ? 'Subiendo...' : 'Subir imagen'}
								</Button>
							) : (
								<div className='h-10 rounded-lg bg-gray-100 px-4 text-sm leading-10 text-gray-500'>
									Se subirán al guardar
								</div>
							)}
						</div>

						{uploadTask && uploadTask.total > 0 && (
							<div className='mt-3 rounded-lg border border-gray-200 bg-white p-3'>
								<div className='mb-2 flex items-center justify-between gap-2 text-xs text-gray-600'>
									<span>
										{uploadTask.active ? 'Subiendo imágenes...' : 'Subida finalizada'}
									</span>
									<Chip size='sm' variant='flat' color={uploadTask.failedCount > 0 ? 'warning' : 'success'}>
										{uploadTask.completed}/{uploadTask.total}
									</Chip>
								</div>
								<Progress
									value={uploadTask.total > 0 ? (uploadTask.completed / uploadTask.total) * 100 : 0}
									color={uploadTask.failedCount > 0 ? 'warning' : 'success'}
									size='sm'
									aria-label='Progreso de subida de imágenes'
								/>
								{uploadTask.currentFileName && (
									<p className='mt-2 truncate text-xs text-gray-500'>Archivo: {uploadTask.currentFileName}</p>
								)}
							</div>
						)}

						{initialData?.id && pendingRetryFiles && pendingRetryFiles.length > 0 && (
							<div className='mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3'>
								<p className='text-xs text-orange-800'>
									{pendingRetryFiles.length} imagen(es) fallaron en la subida automática.
								</p>
								<Button
									size='sm'
									variant='flat'
									color='warning'
									onPress={() => void handleRetryFailedUploads()}
								>
									Reintentar fallidas
								</Button>
							</div>
						)}
					</div>
				)}

				<div className='sm:col-span-2'>
					<Input
						label='Título *'
						name='title'
						defaultValue={initialData?.title}
						key={initialData?.id ?? 'new-title'}
						required
						variant='flat'
						radius='lg'
						size='sm'
					/>
				</div>
				<div className='sm:col-span-2'>
					<Textarea
						label='Descripción *'
						name='description'
						defaultValue={initialData?.description}
						key={initialData?.id ?? 'new-desc'}
						required
						rows={3}
						variant='flat'
						radius='lg'
						size='sm'
					/>
				</div>
				<Input
					label='Slug *'
						name='slug'
						defaultValue={initialData?.slug}
						key={initialData?.id ?? 'new-slug'}
						required
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<Input
					label='SKU'
						name='sku'
						defaultValue={initialData?.sku ?? ''}
						key={initialData?.id ?? 'new-sku'}
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<Input
					label='Precio *'
						name='price'
						type='number'
						step='0.01'
						min='0'
						defaultValue={String(initialData?.price ?? 0)}
						key={initialData?.id ?? 'new-price'}
						required
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<Input
					label='Precio comparativo'
						name='comparePrice'
						type='number'
						step='0.01'
						min='0'
						defaultValue={initialData?.comparePrice != null ? String(initialData.comparePrice) : ''}
						key={initialData?.id ?? 'new-compare'}
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<Input
					label='Stock *'
						name='inStock'
						type='number'
						min='0'
						defaultValue={String(initialData?.inStock ?? 0)}
						key={initialData?.id ?? 'new-stock'}
						required
					variant='flat'
					radius='lg'
					size='sm'
				/>
				<div className='sm:col-span-2'>
					<Select
						label='Género'
						size='sm'
						variant='flat'
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
					<Autocomplete
						label='Categoría'
						size='sm'
						variant='flat'
						placeholder='Buscar categoría'
						selectedKey={categoryKey}
						onSelectionChange={(key) => {
							setCategoryId(key === CATEGORY_PLACEHOLDER_KEY || !key ? '' : String(key));
						}}
					>
						{categoryItems.map((item) => (
							<AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
						))}
					</Autocomplete>
				</div>
				<div className='sm:col-span-2'>
					<Input
						label='Tags'
						name='tags'
						defaultValue={initialData?.tags.join(', ') ?? ''}
						key={initialData?.id ?? 'new-tags'}
						placeholder='tag1, tag2'
						variant='flat'
						radius='lg'
						size='sm'
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
					<Textarea
						label='URLs de imágenes manuales (opcional, una por línea)'
						name='images'
						defaultValue={initialData?.ProductImage.map((i) => i.url).join('\n') ?? ''}
						key={initialData?.id ?? 'new-images'}
						rows={3}
						placeholder='/img/product1.png'
						variant='flat'
						radius='lg'
						size='sm'
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

			<ConfirmDialog
				open={pendingDeleteImageId != null}
				title='Eliminar imagen'
				description='¿Seguro que quieres eliminar esta imagen del producto?'
				confirmLabel='Eliminar'
				cancelLabel='Cancelar'
				variant='danger'
				loading={deletingImage}
				onConfirm={() => void handleConfirmDeleteImage()}
				onCancel={() => setPendingDeleteImageId(null)}
			/>
		</>
	);
}
