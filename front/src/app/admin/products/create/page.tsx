'use client';

import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Card,
	CardBody,
	CardHeader,
	Checkbox,
	Chip,
	Divider,
	Input,
	Progress,
	Select,
	SelectItem,
	Switch,
	Textarea,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useId, useRef, useState } from 'react';
import {
	ArrowLeft,
	CloudUpload,
	GripVertical,
	ImagePlus,
	Package,
	Save,
	Sparkles,
	Star,
	Tag,
	Trash2,
	X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
	AdminPageHeader,
	categoriesApi,
	PERMISSIONS,
	productsApi,
	type AdminCategory,
} from '@/features/admin';

/* ─── Constants ───────────────────────────────────────────────────────── */

const GENDER_OPTIONS = [
	{ value: 'men', label: 'Hombre' },
	{ value: 'women', label: 'Mujer' },
	{ value: 'kid', label: 'Niño' },
	{ value: 'unisex', label: 'Unisex' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/* ─── Types ───────────────────────────────────────────────────────────── */

type PendingImage = {
	id: string;
	file: File;
	preview: string;
	status: 'pending' | 'uploading' | 'done' | 'error';
	errorMessage?: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function AdminProductCreatePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { hasPermission } = usePermissions();
	const canCreate = hasPermission(PERMISSIONS.PRODUCTS_CREATE);
	const fileInputId = useId();

	/* ── Form state ─────────────────────────────────────────────────── */

	const [title, setTitle] = useState('');
	const [slug, setSlug] = useState('');
	const [slugManual, setSlugManual] = useState(false);
	const [description, setDescription] = useState('');
	const [sku, setSku] = useState('');
	const [price, setPrice] = useState('');
	const [comparePrice, setComparePrice] = useState('');
	const [inStock, setInStock] = useState('0');
	const [gender, setGender] = useState('unisex');
	const [categoryId, setCategoryId] = useState('');
	const [tags, setTags] = useState('');
	const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L']);
	const [featured, setFeatured] = useState(false);
	const [isActive, setIsActive] = useState(true);

	/* ── Image state ────────────────────────────────────────────────── */

	const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
	const [makePrimary, setMakePrimary] = useState(true);
	const [dragOver, setDragOver] = useState(false);
	const [dragImageId, setDragImageId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	/* ── Upload progress ────────────────────────────────────────────── */

	const [uploadProgress, setUploadProgress] = useState<{
		active: boolean;
		total: number;
		completed: number;
		failed: number;
		current: string | null;
	}>({ active: false, total: 0, completed: 0, failed: 0, current: null });

	/* ── Data queries ───────────────────────────────────────────────── */

	const { data: categories } = useQuery({
		queryKey: ['admin', 'categories-list'],
		queryFn: () => categoriesApi.list(),
	});

	const uniqueCategories = (() => {
		if (!categories) return [];
		const seen = new Set<string>();
		return categories.filter((c: AdminCategory) => {
			if (seen.has(c.id)) return false;
			seen.add(c.id);
			return true;
		});
	})();

	/* ── Slug auto-generation ───────────────────────────────────────── */

	const handleTitleChange = useCallback(
		(value: string) => {
			setTitle(value);
			if (!slugManual) {
				setSlug(generateSlug(value));
			}
		},
		[slugManual],
	);

	/* ── Image handling ─────────────────────────────────────────────── */

	const addFiles = useCallback((files: File[]) => {
		const valid = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
		if (valid.length < files.length) {
			toast.error('Solo se permiten imágenes jpg, jpeg, png o webp');
		}
		if (valid.length === 0) return;

		const newImages: PendingImage[] = valid.map((file) => ({
			id: crypto.randomUUID(),
			file,
			preview: URL.createObjectURL(file),
			status: 'pending' as const,
		}));

		setPendingImages((prev) => [...prev, ...newImages]);
	}, []);

	const removeImage = useCallback((id: string) => {
		setPendingImages((prev) => {
			const img = prev.find((i) => i.id === id);
			if (img) URL.revokeObjectURL(img.preview);
			return prev.filter((i) => i.id !== id);
		});
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			const files = Array.from(e.dataTransfer.files);
			addFiles(files);
		},
		[addFiles],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? []);
			addFiles(files);
			e.target.value = '';
		},
		[addFiles],
	);

	const reorderImages = useCallback((sourceId: string, targetId: string) => {
		if (sourceId === targetId) return;
		setPendingImages((prev) => {
			const copy = [...prev];
			const srcIdx = copy.findIndex((i) => i.id === sourceId);
			const tgtIdx = copy.findIndex((i) => i.id === targetId);
			if (srcIdx < 0 || tgtIdx < 0) return prev;
			const [moved] = copy.splice(srcIdx, 1);
			copy.splice(tgtIdx, 0, moved);
			return copy;
		});
	}, []);

	/* ── Create mutation ────────────────────────────────────────────── */

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!categoryId) throw new Error('Selecciona una categoría');
			if (selectedSizes.length === 0) throw new Error('Selecciona al menos una talla');
			if (!title.trim()) throw new Error('El título es obligatorio');
			if (!description.trim()) throw new Error('La descripción es obligatoria');
			if (!slug.trim()) throw new Error('El slug es obligatorio');

			const data: Record<string, unknown> = {
				title: title.trim(),
				description: description.trim(),
				slug: slug.trim(),
				sku: sku.trim() || undefined,
				price: Number(price) || 0,
				comparePrice: comparePrice ? Number(comparePrice) : undefined,
				inStock: Number(inStock) || 0,
				gender,
				categoryId,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				sizes: selectedSizes,
				featured,
				isActive,
			};

			const product = await productsApi.create(data);

			/* Upload images sequentially */
			if (pendingImages.length > 0) {
				setUploadProgress({
					active: true,
					total: pendingImages.length,
					completed: 0,
					failed: 0,
					current: pendingImages[0].file.name,
				});

				let failCount = 0;

				for (let idx = 0; idx < pendingImages.length; idx++) {
					const img = pendingImages[idx];
					setPendingImages((prev) =>
						prev.map((i) => (i.id === img.id ? { ...i, status: 'uploading' } : i)),
					);
					setUploadProgress((prev) => ({ ...prev, current: img.file.name }));

					try {
						const shouldBePrimary = makePrimary && idx === 0;
						await productsApi.uploadImage(product.id, img.file, shouldBePrimary);
						setPendingImages((prev) =>
							prev.map((i) => (i.id === img.id ? { ...i, status: 'done' } : i)),
						);
					} catch (err) {
						failCount++;
						setPendingImages((prev) =>
							prev.map((i) =>
								i.id === img.id
									? {
											...i,
											status: 'error',
											errorMessage: err instanceof Error ? err.message : 'Error al subir',
										}
									: i,
							),
						);
					}

					setUploadProgress((prev) => ({
						...prev,
						completed: idx + 1,
						failed: failCount,
					}));
				}

				setUploadProgress((prev) => ({ ...prev, active: false, current: null }));

				if (failCount > 0) {
					toast.error(`Producto creado, pero ${failCount} imagen(es) fallaron al subirse.`);
				}
			}

			return product;
		},
		onSuccess: () => {
			toast.success('Producto creado exitosamente');
			queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
			router.push('/admin/products');
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	const isSubmitting = createMutation.isPending;

	/* ── Permission guard ───────────────────────────────────────────── */

	if (!canCreate) {
		return (
			<div className='flex min-h-[60vh] flex-col items-center justify-center gap-4'>
				<Package size={48} className='text-gray-300' />
				<p className='text-gray-500'>No tienes permisos para crear productos</p>
				<Link href='/admin/products'>
					<Button variant='flat'>Volver a productos</Button>
				</Link>
			</div>
		);
	}

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<>
			<AdminPageHeader
				title='Crear producto'
				description='Completa la información para añadir un nuevo producto al catálogo'
				actions={
					<Link href='/admin/products'>
						<Button variant='flat' startContent={<ArrowLeft size={16} />}>
							Volver
						</Button>
					</Link>
				}
			/>

			<form onSubmit={handleSubmit}>
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* ─── Left column: main content ─────────────────────────── */}
					<div className='flex flex-col gap-6 lg:col-span-2'>
						{/* Basic info */}
						<Card shadow='sm'>
							<CardHeader className='flex items-center gap-2 px-6 pb-0 pt-5'>
								<Package size={18} className='text-default-500' />
								<h2 className='text-base font-semibold'>Información básica</h2>
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='gap-4 px-6 py-5'>
								<Input
									label='Título'
									placeholder='Ej: Camiseta premium algodón orgánico'
									value={title}
									onValueChange={handleTitleChange}
									isRequired
									variant='flat'
									radius='lg'
									size='sm'
									isDisabled={isSubmitting}
								/>
								<div className='flex items-end gap-2'>
									<Input
										label='Slug'
										placeholder='camiseta-premium-algodon'
										value={slug}
										onValueChange={(v) => {
											setSlugManual(true);
											setSlug(v);
										}}
										isRequired
										variant='flat'
										radius='lg'
										size='sm'
										className='flex-1'
										isDisabled={isSubmitting}
										description={
											slugManual
												? 'Editando manualmente'
												: 'Se genera automáticamente del título'
										}
									/>
									{slugManual && (
										<Button
											variant='flat'
											size='sm'
											onPress={() => {
												setSlugManual(false);
												setSlug(generateSlug(title));
											}}
											isDisabled={isSubmitting}
										>
											Auto
										</Button>
									)}
								</div>
								<Input
									label='SKU'
									placeholder='SKU-001 (opcional)'
									value={sku}
									onValueChange={setSku}
									variant='flat'
									radius='lg'
									size='sm'
									isDisabled={isSubmitting}
								/>
								<Textarea
									label='Descripción'
									placeholder='Describe el producto en detalle...'
									value={description}
									onValueChange={setDescription}
									isRequired
									minRows={4}
									maxRows={8}
									variant='flat'
									radius='lg'
									size='sm'
									isDisabled={isSubmitting}
								/>
							</CardBody>
						</Card>

						{/* Media / Images */}
						<Card shadow='sm'>
							<CardHeader className='flex items-center gap-2 px-6 pb-0 pt-5'>
								<ImagePlus size={18} className='text-default-500' />
								<h2 className='text-base font-semibold'>Imágenes del producto</h2>
								{pendingImages.length > 0 && (
									<Chip size='sm' variant='flat' color='primary' className='ml-auto'>
										{pendingImages.length} imagen{pendingImages.length !== 1 ? 'es' : ''}
									</Chip>
								)}
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='px-6 py-5'>
								{/* Drop zone */}
								<div
									onDragOver={(e) => {
										e.preventDefault();
										setDragOver(true);
									}}
									onDragLeave={() => setDragOver(false)}
									onDrop={handleDrop}
									onClick={() => fileInputRef.current?.click()}
									className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
										dragOver
											? 'border-primary bg-primary-50'
											: 'border-default-300 bg-default-50 hover:border-primary hover:bg-primary-50/30'
									}`}
								>
									<div
										className={`rounded-full p-3 transition-colors ${
											dragOver ? 'bg-primary-100' : 'bg-default-100'
										}`}
									>
										<CloudUpload
											size={28}
											className={dragOver ? 'text-primary' : 'text-default-400'}
										/>
									</div>
									<div className='text-center'>
										<p className='text-sm font-medium text-default-700'>
											Arrastra y suelta imágenes aquí
										</p>
										<p className='mt-1 text-xs text-default-400'>
											JPG, PNG o WebP • Máximo 5MB por imagen
										</p>
									</div>
									<Button
										variant='flat'
										color='primary'
										size='sm'
										startContent={<ImagePlus size={14} />}
										onPress={() => fileInputRef.current?.click()}
										type='button'
									>
										Seleccionar archivos
									</Button>
									<input
										ref={fileInputRef}
										id={fileInputId}
										type='file'
										multiple
										accept={ACCEPTED_IMAGE_TYPES.join(',')}
										onChange={handleFileSelect}
										className='hidden'
									/>
								</div>

								{/* Image preview grid */}
								{pendingImages.length > 0 && (
									<div className='mt-4'>
										<p className='mb-2 text-xs text-default-500'>
											Arrastra para reordenar • La primera imagen será la principal
										</p>
										<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
											{pendingImages.map((img, idx) => (
												<div
													key={img.id}
													draggable={!isSubmitting}
													onDragStart={() => setDragImageId(img.id)}
													onDragOver={(e) => e.preventDefault()}
													onDrop={(e) => {
														e.preventDefault();
														e.stopPropagation();
														if (dragImageId) reorderImages(dragImageId, img.id);
														setDragImageId(null);
													}}
													className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
														dragImageId === img.id
															? 'border-primary shadow-md'
															: img.status === 'error'
																? 'border-danger'
																: img.status === 'done'
																	? 'border-success'
																	: 'border-default-200'
													}`}
												>
													{/* Image */}
													<div className='relative aspect-square bg-default-100'>
														<Image
															src={img.preview}
															alt={img.file.name}
															fill
															className='object-cover'
															unoptimized
														/>

														{/* overlay on hover */}
														<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100'>
															<button
																type='button'
																onClick={() => removeImage(img.id)}
																disabled={isSubmitting}
																className='rounded-full bg-white/90 p-1.5 text-danger hover:bg-white disabled:opacity-50'
															>
																<Trash2 size={14} />
															</button>
														</div>

														{/* grip icon */}
														<div className='absolute left-1 top-1 rounded bg-black/30 p-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
															<GripVertical size={12} className='text-white' />
														</div>

														{/* status overlay */}
														{img.status === 'uploading' && (
															<div className='absolute inset-0 flex items-center justify-center bg-black/50'>
																<div className='h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent' />
															</div>
														)}
														{img.status === 'done' && (
															<div className='absolute right-1 top-1'>
																<Chip size='sm' color='success' variant='solid'>
																	✓
																</Chip>
															</div>
														)}
														{img.status === 'error' && (
															<div className='absolute right-1 top-1'>
																<Chip size='sm' color='danger' variant='solid'>
																	✗
																</Chip>
															</div>
														)}
													</div>

													{/* Info footer */}
													<div className='border-t border-default-100 bg-default-50 px-2 py-1.5'>
														<div className='flex items-center justify-between'>
															{idx === 0 && makePrimary ? (
																<Chip
																	size='sm'
																	variant='flat'
																	color='warning'
																	startContent={<Star size={10} />}
																>
																	Principal
																</Chip>
															) : (
																<span className='text-[10px] text-default-400'>
																	#{idx + 1}
																</span>
															)}
															<span className='text-[10px] text-default-400'>
																{formatFileSize(img.file.size)}
															</span>
														</div>
														<p className='mt-0.5 truncate text-[10px] text-default-500'>
															{img.file.name}
														</p>
														{img.status === 'error' && img.errorMessage && (
															<p className='mt-0.5 truncate text-[10px] text-danger'>
																{img.errorMessage}
															</p>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Upload progress bar */}
								{uploadProgress.total > 0 && (
									<div className='mt-4 rounded-xl border border-default-200 bg-default-50 p-4'>
										<div className='mb-2 flex items-center justify-between text-xs'>
											<span className='text-default-600'>
												{uploadProgress.active
													? 'Subiendo imágenes...'
													: 'Subida finalizada'}
											</span>
											<Chip
												size='sm'
												variant='flat'
												color={uploadProgress.failed > 0 ? 'warning' : 'success'}
											>
												{uploadProgress.completed}/{uploadProgress.total}
											</Chip>
										</div>
										<Progress
											value={
												uploadProgress.total > 0
													? (uploadProgress.completed / uploadProgress.total) * 100
													: 0
											}
											color={uploadProgress.failed > 0 ? 'warning' : 'success'}
											size='sm'
											aria-label='Progreso de subida'
										/>
										{uploadProgress.current && (
											<p className='mt-2 truncate text-xs text-default-500'>
												Subiendo: {uploadProgress.current}
											</p>
										)}
									</div>
								)}

								{/* Primary checkbox */}
								{pendingImages.length > 0 && (
									<div className='mt-3'>
										<Checkbox
											size='sm'
											isSelected={makePrimary}
											onValueChange={setMakePrimary}
											isDisabled={isSubmitting}
										>
											<span className='text-xs text-default-600'>
												Marcar la primera imagen como principal
											</span>
										</Checkbox>
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* ─── Right column: sidebar ─────────────────────────────── */}
					<div className='flex flex-col gap-6'>
						{/* Pricing & Stock */}
						<Card shadow='sm'>
							<CardHeader className='flex items-center gap-2 px-6 pb-0 pt-5'>
								<Tag size={18} className='text-default-500' />
								<h2 className='text-base font-semibold'>Precio y stock</h2>
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='gap-4 px-6 py-5'>
								<Input
									label='Precio'
									placeholder='0.00'
									type='number'
									step='0.01'
									min='0'
									value={price}
									onValueChange={setPrice}
									isRequired
									variant='flat'
									radius='lg'
									size='sm'
									startContent={
										<span className='text-xs text-default-400'>$</span>
									}
									isDisabled={isSubmitting}
								/>
								<Input
									label='Precio comparativo'
									placeholder='0.00'
									type='number'
									step='0.01'
									min='0'
									value={comparePrice}
									onValueChange={setComparePrice}
									variant='flat'
									radius='lg'
									size='sm'
									startContent={
										<span className='text-xs text-default-400'>$</span>
									}
									description='Precio tachado (precio anterior)'
									isDisabled={isSubmitting}
								/>
								<Input
									label='Stock'
									placeholder='0'
									type='number'
									min='0'
									value={inStock}
									onValueChange={setInStock}
									isRequired
									variant='flat'
									radius='lg'
									size='sm'
									isDisabled={isSubmitting}
								/>
							</CardBody>
						</Card>

						{/* Classification */}
						<Card shadow='sm'>
							<CardHeader className='flex items-center gap-2 px-6 pb-0 pt-5'>
								<Sparkles size={18} className='text-default-500' />
								<h2 className='text-base font-semibold'>Clasificación</h2>
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='gap-4 px-6 py-5'>
								<Select
									label='Género'
									size='sm'
									variant='flat'
									selectedKeys={new Set([gender])}
									onSelectionChange={(keys) => {
										const k = Array.from(keys as Set<string>)[0];
										if (k) setGender(String(k));
									}}
									isDisabled={isSubmitting}
								>
									{GENDER_OPTIONS.map((g) => (
										<SelectItem key={g.value} textValue={g.label}>
											{g.label}
										</SelectItem>
									))}
								</Select>

								<Autocomplete
									label='Categoría'
									size='sm'
									variant='flat'
									placeholder='Buscar categoría'
									isRequired
									selectedKey={categoryId || null}
									onSelectionChange={(key) => {
										setCategoryId(key ? String(key) : '');
									}}
									isDisabled={isSubmitting}
								>
									{uniqueCategories.map((c: AdminCategory) => (
										<AutocompleteItem key={c.id}>{c.name}</AutocompleteItem>
									))}
								</Autocomplete>

								<Input
									label='Tags'
									placeholder='tag1, tag2, tag3'
									value={tags}
									onValueChange={setTags}
									variant='flat'
									radius='lg'
									size='sm'
									description='Separados por comas'
									isDisabled={isSubmitting}
								/>
							</CardBody>
						</Card>

						{/* Sizes */}
						<Card shadow='sm'>
							<CardHeader className='px-6 pb-0 pt-5'>
								<h2 className='text-base font-semibold'>Tallas</h2>
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='px-6 py-5'>
								<div className='flex flex-wrap gap-2'>
									{SIZE_OPTIONS.map((s) => (
										<Chip
											key={s}
											variant={selectedSizes.includes(s) ? 'solid' : 'flat'}
											color={selectedSizes.includes(s) ? 'primary' : 'default'}
											className='cursor-pointer transition-all'
											onClick={() => {
												if (isSubmitting) return;
												setSelectedSizes((prev) =>
													prev.includes(s)
														? prev.filter((x) => x !== s)
														: [...prev, s],
												);
											}}
										>
											{s}
										</Chip>
									))}
								</div>
								{selectedSizes.length === 0 && (
									<p className='mt-2 text-xs text-danger'>
										Selecciona al menos una talla
									</p>
								)}
							</CardBody>
						</Card>

						{/* Settings */}
						<Card shadow='sm'>
							<CardHeader className='px-6 pb-0 pt-5'>
								<h2 className='text-base font-semibold'>Configuración</h2>
							</CardHeader>
							<Divider className='mt-3' />
							<CardBody className='gap-4 px-6 py-5'>
								<Switch
									size='sm'
									isSelected={isActive}
									onValueChange={setIsActive}
									isDisabled={isSubmitting}
								>
									<span className='text-sm'>Producto activo</span>
								</Switch>
								<Switch
									size='sm'
									isSelected={featured}
									onValueChange={setFeatured}
									isDisabled={isSubmitting}
								>
									<span className='text-sm'>Producto destacado</span>
								</Switch>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* ─── Bottom action bar ─────────────────────────────────────── */}
				<div className='sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-default-200 bg-white/80 px-4 py-4 backdrop-blur-lg lg:-mx-8 lg:px-8'>
					<Link href='/admin/products'>
						<Button
							variant='flat'
							startContent={<X size={16} />}
							isDisabled={isSubmitting}
							type='button'
						>
							Cancelar
						</Button>
					</Link>
					<Button
						type='submit'
						color='primary'
						startContent={<Save size={16} />}
						isLoading={isSubmitting}
						isDisabled={isSubmitting}
					>
						{isSubmitting ? 'Creando producto...' : 'Crear producto'}
					</Button>
				</div>
			</form>
		</>
	);
}
