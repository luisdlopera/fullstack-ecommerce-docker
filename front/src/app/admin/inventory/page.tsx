'use client';

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
	Textarea,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	AlertTriangle,
	ArrowDownCircle,
	ArrowUpCircle,
	Boxes,
	Clock,
	PackageX,
	Trash2,
	TrendingDown,
	Warehouse as WarehouseIcon,
	ArrowRightLeft,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
	AdminPageHeader,
	DataTable,
	ErrorState,
	inventoryApi,
	warehousesApi,
	inventoryTransferApi,
	PERMISSIONS,
	SearchInput,
	StatCard,
	StatusBadge,
	useDataTable,
	type Column,
	type BulkAction,
	type InventoryItem,
	type InventoryMovement,
} from '@/features/admin';

const MOVEMENT_LABELS: Record<string, { label: string; color: 'success' | 'danger' | 'warning' | 'primary' | 'default' }> = {
	IN: { label: 'Ingreso', color: 'success' },
	OUT: { label: 'Salida', color: 'danger' },
	ADJUSTMENT: { label: 'Ajuste', color: 'warning' },
	RESERVATION: { label: 'Reserva', color: 'primary' },
	COMMIT: { label: 'Compromiso', color: 'default' },
	RELEASE: { label: 'Liberación', color: 'success' },
	RETURN: { label: 'Devolución', color: 'success' },
};

const FILTER_OPTIONS = [
	{ value: '', label: 'Todos' },
	{ value: 'lowStock', label: 'Stock bajo' },
	{ value: 'outOfStock', label: 'Agotados' },
];

const GENDER_FILTER_OPTIONS = [
	{ value: '', label: 'Todas las colecciones' },
	{ value: 'men', label: 'Hombres' },
	{ value: 'women', label: 'Mujeres' },
	{ value: 'kid', label: 'Niños' },
	{ value: 'unisex', label: 'Unisex' },
];

export default function AdminInventoryPage() {
	const { hasPermission } = usePermissions();
	const canAdjust = hasPermission(PERMISSIONS.INVENTORY_ADJUST);
	const canDelete = hasPermission(PERMISSIONS.INVENTORY_ADJUST);
	const queryClient = useQueryClient();

	const {
		selectedKeys,
		handleSelectionChange,
		pagination,
		handlePageChange,
		handleLimitChange,
		clearSelection,
		selectedItems,
	} = useDataTable<InventoryItem>([], (item: InventoryItem) => item.id);

	const handlePaginationChange = (newPagination: { page: number; limit: number }) => {
		handlePageChange(newPagination.page);
		handleLimitChange(newPagination.limit);
	};

	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('');
	const [genderFilter, setGenderFilter] = useState('');
	const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
	const [movementsItem, setMovementsItem] = useState<InventoryItem | null>(null);
	const [variantsItem, setVariantsItem] = useState<InventoryItem | null>(null);
	const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
	const [adjustQty, setAdjustQty] = useState('');
	const [adjustReason, setAdjustReason] = useState('');
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [itemsToDelete, setItemsToDelete] = useState<InventoryItem[]>([]);

	// Transfer state
	const [transferQty, setTransferQty] = useState('');
	const [transferNote, setTransferNote] = useState('');
	const [targetWarehouseId, setTargetWarehouseId] = useState('');
	const { data: warehousesList } = useQuery({
		queryKey: ['admin', 'warehouses-list'],
		queryFn: () => warehousesApi.list({ limit: 100 }),
		enabled: !!transferItem,
	});

	const { data: summary } = useQuery({
		queryKey: ['admin', 'inventory', 'summary'],
		queryFn: () => inventoryApi.getSummary(),
	});

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'inventory', 'items', pagination.page, pagination.limit, search, filter, genderFilter],
		queryFn: () =>
			inventoryApi.listItems({
				page: pagination.page,
				limit: pagination.limit,
				search: search || undefined,
				lowStock: filter === 'lowStock' ? true : undefined,
				outOfStock: filter === 'outOfStock' ? true : undefined,
				gender: genderFilter || undefined,
			}),
	});

	const { data: lowStockItems } = useQuery({
		queryKey: ['admin', 'inventory', 'low-stock'],
		queryFn: () => inventoryApi.getLowStock(),
	});

	const adjustMutation = useMutation({
		mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason: string }) =>
			inventoryApi.adjustInventory(id, quantity, reason),
		onSuccess: () => {
			toast.success('Inventario ajustado correctamente');
			setAdjustItem(null);
			setAdjustQty('');
			setAdjustReason('');
			queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const bulkDeleteMutation = useMutation({
		mutationFn: (ids: string[]) => inventoryApi.bulkDeleteItems(ids),
		onSuccess: (result) => {
			toast.success(result.message);
			setDeleteConfirmOpen(false);
			setItemsToDelete([]);
			clearSelection();
			queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
		},
		onError: (err: Error) => {
			toast.error(err.message);
			setDeleteConfirmOpen(false);
			setItemsToDelete([]);
		},
	});

	const handleBulkDelete = () => {
		setItemsToDelete(selectedItems);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = () => {
		const ids = itemsToDelete.map((item) => item.id);
		bulkDeleteMutation.mutate(ids);
	};

	// Transfer mutation
	const transferMutation = useMutation({
		mutationFn: (data: {
			productId: string;
			sourceWarehouseId: string;
			targetWarehouseId: string;
			quantity: number;
			note?: string;
		}) => inventoryTransferApi.transfer(data),
		onSuccess: (result) => {
			toast.success(result.message);
			setTransferItem(null);
			setTransferQty('');
			setTransferNote('');
			setTargetWarehouseId('');
			queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const handleTransfer = () => {
		if (!transferItem || !targetWarehouseId || !transferQty) return;
		transferMutation.mutate({
			productId: transferItem.productId,
			sourceWarehouseId: transferItem.id.split('_')[0] === transferItem.productId 
				? (warehousesList?.data.find(w => w.code === transferItem.location)?.id || '')
				: '',
			targetWarehouseId,
			quantity: Number(transferQty),
			note: transferNote,
		});
	};

	const columns: Column<InventoryItem>[] = [
		{
			key: 'product',
			header: 'Producto',
			render: (item) => (
				<div className='flex items-center gap-3'>
					{item.product.ProductImage?.[0]?.url ? (
						<Image
							src={item.product.ProductImage[0].url}
							alt={item.product.title}
							width={36}
							height={36}
							className='h-9 w-9 rounded-lg object-cover'
							unoptimized
						/>
					) : (
						<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100'>
							<Boxes size={14} className='text-gray-400' />
						</div>
					)}
					<div>
						<p className='text-sm font-medium text-gray-900'>{item.product.title}</p>
						<p className='text-xs text-gray-500'>{item.product.sku ?? item.product.slug}</p>
					</div>
				</div>
			),
		},
		{
			key: 'collection',
			header: 'Colección',
			render: (item) => {
				const genderLabels: Record<string, string> = {
					men: 'Hombres',
					women: 'Mujeres',
					kid: 'Niños',
					unisex: 'Unisex',
				};
				const genderColors: Record<string, 'primary' | 'danger' | 'warning' | 'default'> = {
					men: 'primary',
					women: 'danger',
					kid: 'warning',
					unisex: 'default',
				};
				return (
					<Chip size='sm' variant='flat' color={genderColors[item.product.gender] || 'default'}>
						{genderLabels[item.product.gender] || item.product.gender}
					</Chip>
				);
			},
		},
		{
			key: 'size',
			header: 'Talla',
			render: (item) => (
				<Chip size='sm' variant='flat' color='primary'>
					{item.size}
				</Chip>
			),
		},
		{
			key: 'available',
			header: 'Disponible',
			render: (item) => {
				const isLow = item.available > 0 && item.available <= item.minStock;
				const isOut = item.available === 0;
				return (
					<StatusBadge
						value={isOut ? 'Agotado' : `${item.available} uds`}
						variant={isOut ? 'red' : isLow ? 'yellow' : 'green'}
					/>
				);
			},
		},
		{
			key: 'reserved',
			header: 'Reservado',
			render: (item) => (
				<span className={`text-sm font-medium ${item.reserved > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
					{item.reserved}
				</span>
			),
		},
		{
			key: 'committed',
			header: 'Comprometido',
			render: (item) => (
				<span className={`text-sm font-medium ${item.committed > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
					{item.committed}
				</span>
			),
		},
		{
			key: 'minStock',
			header: 'Mín.',
			render: (item) => <span className='text-sm text-gray-500'>{item.minStock}</span>,
		},
		{
			key: 'location',
			header: 'Ubicación',
			render: (item) => (
				<Chip size='sm' variant='flat' color='default' startContent={<WarehouseIcon size={10} />}>
					{item.location}
				</Chip>
			),
		},
		{
			key: 'price',
			header: 'Precio',
			render: (item) => {
				const hasDiscount = item.product.discountPrice && item.product.discountPrice > 0;
				const isDiscountActive =
					hasDiscount &&
					(!item.product.discountStartsAt || new Date(item.product.discountStartsAt) <= new Date()) &&
					(!item.product.discountEndsAt || new Date(item.product.discountEndsAt) >= new Date());
				return (
					<div className='flex flex-col'>
						<span className={`text-sm font-medium ${isDiscountActive ? 'text-green-600' : 'text-gray-900'}`}>
							${item.product.discountPrice || item.product.price}
						</span>
						{isDiscountActive && item.product.comparePrice && (
							<span className='text-xs text-gray-400 line-through'>${item.product.comparePrice}</span>
						)}
						{isDiscountActive && (
							<Chip size='sm' variant='flat' color='success' className='mt-1 w-fit'>
								En oferta
							</Chip>
						)}
					</div>
				);
			},
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (item) => (
				<div className='flex justify-end gap-2'>
					<button
						type='button'
						onClick={() => setMovementsItem(item)}
						className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
					>
						Movimientos
					</button>
					<button
						type='button'
						onClick={() => setVariantsItem(item)}
						className='rounded-lg px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50'
					>
						Variantes
					</button>
					{canAdjust && (
						<button
							type='button'
							onClick={() => setAdjustItem(item)}
							className='rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50'
						>
							Ajustar
						</button>
					)}
					{canAdjust && (
						<button
							type='button'
							onClick={() => setTransferItem(item)}
							className='rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50'
						>
							Transferir
						</button>
					)}
				</div>
			),
		},
	];

	const bulkActions: BulkAction<InventoryItem>[] = canDelete
		? [
				{
					key: 'delete',
					label: 'Eliminar',
					icon: <Trash2 size={16} />,
					variant: 'flat',
					color: 'danger',
					onAction: handleBulkDelete,
					isLoading: bulkDeleteMutation.isPending,
				},
			]
		: [];

	if (error) {
		return (
			<>
				<AdminPageHeader title='Inventario' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader title='Inventario' description='Gestión operativa de stock por producto y variante' />

			<div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
				<StatCard title='Ítems registrados' value={summary?.totalItems ?? 0} icon={Boxes} />
				<StatCard title='Disponible total' value={summary?.totalAvailable ?? 0} icon={ArrowUpCircle} />
				<StatCard title='Reservado' value={summary?.totalReserved ?? 0} icon={Clock} />
				<StatCard title='Comprometido' value={summary?.totalCommitted ?? 0} icon={ArrowDownCircle} />
				<StatCard title='Stock bajo' value={summary?.lowStockCount ?? 0} icon={TrendingDown} />
				<StatCard title='Agotados' value={summary?.outOfStockCount ?? 0} icon={PackageX} />
			</div>

			{(lowStockItems?.length ?? 0) > 0 && (
				<Card shadow='none' className='mb-6 border border-amber-200 bg-amber-50'>
					<CardBody className='flex flex-row items-center gap-3 px-4 py-3'>
						<AlertTriangle size={18} className='flex-shrink-0 text-amber-600' />
						<div className='flex-1'>
							<p className='text-sm font-semibold text-amber-800'>
								{lowStockItems!.length} producto(s) con stock bajo
							</p>
							<p className='mt-0.5 text-xs text-amber-700'>
								{lowStockItems!
									.slice(0, 3)
									.map((i) => `${i.product.title} (${i.size})`)
									.join(', ')}
								{lowStockItems!.length > 3 && ` y ${lowStockItems!.length - 3} más...`}
							</p>
						</div>
						<Button
							size='sm'
							variant='flat'
							color='warning'
							onPress={() => {
								setFilter('lowStock');
								setGenderFilter('');
								handlePageChange(1);
							}}
						>
							Ver todos
						</Button>
					</CardBody>
				</Card>
			)}

			<DataTable
				columns={columns}
				data={data?.data ?? []}
				paginationMeta={data?.meta}
				onPaginationChange={handlePaginationChange}
				isLoading={isLoading}
				isError={!!error}
				errorMessage={error ? (error as Error).message : 'Error al cargar el inventario'}
				onRetry={() => refetch()}
				emptyMessage='No se encontraron ítems de inventario'
				selectable={canDelete}
				rowKey={(item) => item.id}
				selectedKeys={selectedKeys}
				onSelectionChange={handleSelectionChange}
				bulkActions={bulkActions}
				toolbar={
					<div className='flex flex-wrap items-center gap-3'>
						<SearchInput
							value={search}
							onChange={(v) => {
								setSearch(v);
								handlePageChange(1);
							}}
							placeholder='Buscar por nombre de producto o SKU...'
						/>
						<Select
							size='sm'
							variant='flat'
							className='w-40'
							selectedKeys={new Set([filter])}
							onSelectionChange={(keys) => {
								const k = Array.from(keys as Set<string>)[0] ?? '';
								setFilter(k);
								handlePageChange(1);
							}}
							aria-label='Filtro de stock'
						>
							{FILTER_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} textValue={opt.label}>
									{opt.label}
								</SelectItem>
							))}
						</Select>
						<Select
							size='sm'
							variant='flat'
							className='w-48'
							placeholder='Filtrar por colección'
							selectedKeys={new Set([genderFilter])}
							onSelectionChange={(keys) => {
								const k = Array.from(keys as Set<string>)[0] ?? '';
								setGenderFilter(k);
								handlePageChange(1);
							}}
							aria-label='Filtro de colección'
						>
							{GENDER_FILTER_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} textValue={opt.label}>
									{opt.label}
								</SelectItem>
							))}
						</Select>
						{selectedKeys.size > 0 && (
							<Chip size='sm' variant='flat' color='primary'>
								{selectedKeys.size} seleccionado{selectedKeys.size !== 1 ? 's' : ''}
							</Chip>
						)}
					</div>
				}
			/>

			<Modal isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} size='md'>
				<ModalContent>
					<ModalHeader className='flex flex-col gap-1'>
						<span className='text-lg font-semibold'>Ajustar inventario</span>
						{adjustItem && (
							<span className='text-sm font-normal text-gray-500'>
								{adjustItem.product.title} — Talla: {adjustItem.size}
							</span>
						)}
					</ModalHeader>
					<ModalBody>
						{adjustItem && (
							<div className='mb-4 rounded-lg bg-gray-50 p-3'>
								<div className='grid grid-cols-3 gap-2 text-center text-xs'>
									<div>
										<p className='text-gray-500'>Disponible</p>
										<p className='text-lg font-bold text-green-600'>{adjustItem.available}</p>
									</div>
									<div>
										<p className='text-gray-500'>Reservado</p>
										<p className='text-lg font-bold text-amber-600'>{adjustItem.reserved}</p>
									</div>
									<div>
										<p className='text-gray-500'>Comprometido</p>
										<p className='text-lg font-bold text-blue-600'>{adjustItem.committed}</p>
									</div>
								</div>
							</div>
						)}
						<Input
							label='Cantidad'
							type='number'
							placeholder='Ej: 10 (positivo para agregar, negativo para quitar)'
							value={adjustQty}
							onValueChange={setAdjustQty}
							isRequired
							variant='flat'
							radius='lg'
							size='sm'
							description='Usa valores negativos para disminuir stock'
						/>
						<Textarea
							label='Motivo del ajuste'
							placeholder='Ej: Reposición de proveedor, Corrección de conteo...'
							value={adjustReason}
							onValueChange={setAdjustReason}
							isRequired
							variant='flat'
							radius='lg'
							size='sm'
							minRows={2}
							maxRows={4}
						/>
					</ModalBody>
					<ModalFooter>
						<Button variant='flat' onPress={() => setAdjustItem(null)}>
							Cancelar
						</Button>
						<Button
							color='primary'
							isLoading={adjustMutation.isPending}
							isDisabled={!adjustQty || !adjustReason.trim() || adjustMutation.isPending}
							onPress={() => {
								if (!adjustItem) return;
								adjustMutation.mutate({
									id: adjustItem.id,
									quantity: Number(adjustQty),
									reason: adjustReason.trim(),
								});
							}}
						>
							Aplicar ajuste
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{movementsItem && <MovementsModal item={movementsItem} onClose={() => setMovementsItem(null)} />}
			{variantsItem && <VariantsModal item={variantsItem} onClose={() => setVariantsItem(null)} />}

			<Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} size='md'>
				<ModalContent>
					<ModalHeader className='flex flex-col gap-1'>
						<span className='text-lg font-semibold text-danger'>Eliminar ítems de inventario</span>
					</ModalHeader>
					<ModalBody>
						<p className='text-sm text-gray-600'>
							¿Estás seguro de que deseas eliminar {itemsToDelete.length} ítem(s) de inventario?
						</p>
						<p className='mt-2 text-xs text-gray-500'>
							Nota: Solo se pueden eliminar ítems que no tengan historial de movimientos de stock.
						</p>
						{itemsToDelete.length > 0 && (
							<div className='mt-3 max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-2'>
								{itemsToDelete.slice(0, 5).map((item) => (
									<div key={item.id} className='py-1 text-xs text-gray-700'>
										• {item.product.title} — {item.size}
									</div>
								))}
								{itemsToDelete.length > 5 && (
									<div className='py-1 text-xs text-gray-500 italic'>
										y {itemsToDelete.length - 5} más...
									</div>
								)}
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button variant='flat' onPress={() => setDeleteConfirmOpen(false)}>
							Cancelar
						</Button>
						<Button
							color='danger'
							isLoading={bulkDeleteMutation.isPending}
							onPress={confirmDelete}
						>
							Eliminar {itemsToDelete.length} ítem(s)
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Transfer Modal */}
			<Modal isOpen={!!transferItem} onClose={() => setTransferItem(null)} size='md'>
				<ModalContent>
					<ModalHeader className='flex flex-col gap-1'>
						<span className='text-lg font-semibold flex items-center gap-2'>
							<ArrowRightLeft size={20} />
							Transferir Stock
						</span>
						{transferItem && (
							<span className='text-sm font-normal text-gray-500'>
								{transferItem.product.title} — De: {transferItem.location}
							</span>
						)}
					</ModalHeader>
					<ModalBody>
						{transferItem && (
							<div className='mb-4 rounded-lg bg-gray-50 p-3'>
								<div className='grid grid-cols-3 gap-2 text-center text-xs'>
									<div>
										<p className='text-gray-500'>Disponible</p>
										<p className='text-lg font-bold text-green-600'>{transferItem.available}</p>
									</div>
									<div>
										<p className='text-gray-500'>Reservado</p>
										<p className='text-lg font-bold text-amber-600'>{transferItem.reserved}</p>
									</div>
									<div>
										<p className='text-gray-500'>Ubicación</p>
										<p className='text-sm font-bold text-blue-600'>{transferItem.location}</p>
									</div>
								</div>
							</div>
						)}
						<Select
							label='Sucursal destino'
							placeholder='Selecciona la sucursal destino'
							selectedKeys={targetWarehouseId ? new Set([targetWarehouseId]) : new Set()}
							onSelectionChange={(keys) => {
								const selected = Array.from(keys as Set<string>)[0];
								setTargetWarehouseId(selected || '');
							}}
							isRequired
						>
							{(warehousesList?.data || [])
								.filter((w) => w.code !== transferItem?.location)
								.map((w) => (
									<SelectItem key={w.id} textValue={w.name}>
										{w.name} ({w.code})
									</SelectItem>
								))}
							</Select>
							<Input
								label='Cantidad a transferir'
								type='number'
								min={1}
								max={transferItem?.available || 0}
								placeholder={`Máximo: ${transferItem?.available || 0}`}
								value={transferQty}
								onValueChange={setTransferQty}
								isRequired
								className='mt-4'
							/>
							<Textarea
								label='Nota (opcional)'
								placeholder='Motivo de la transferencia...'
								value={transferNote}
								onValueChange={setTransferNote}
								className='mt-2'
								minRows={2}
							/>
						</ModalBody>
						<ModalFooter>
							<Button variant='flat' onPress={() => setTransferItem(null)}>
								Cancelar
							</Button>
							<Button
								color='primary'
								onPress={handleTransfer}
								isLoading={transferMutation.isPending}
								isDisabled={!targetWarehouseId || !transferQty || Number(transferQty) <= 0}
							>
								Transferir {transferQty || 0} unidades
							</Button>
						</ModalFooter>
					</ModalContent>
			</Modal>
		</>
	);
}

function MovementsModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
	const [movPage, setMovPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ['admin', 'inventory', 'movements', item.id, movPage],
		queryFn: () => inventoryApi.listMovements({ inventoryItemId: item.id, page: movPage, limit: 15 }),
	});

	const movColumns: Column<InventoryMovement>[] = [
		{
			key: 'date',
			header: 'Fecha',
			render: (m) => (
				<span className='text-xs text-gray-600'>
					{new Date(m.createdAt).toLocaleDateString('es', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					})}
				</span>
			),
		},
		{
			key: 'type',
			header: 'Tipo',
			render: (m) => {
				const info = MOVEMENT_LABELS[m.type] ?? { label: m.type, color: 'default' as const };
				return (
					<Chip size='sm' variant='flat' color={info.color}>
						{info.label}
					</Chip>
				);
			},
		},
		{
			key: 'quantity',
			header: 'Cantidad',
			render: (m) => (
				<span
					className={`text-sm font-bold ${m.quantity > 0 ? 'text-green-600' : m.quantity < 0 ? 'text-red-600' : 'text-gray-500'}`}
				>
					{m.quantity > 0 ? '+' : ''}
					{m.quantity}
				</span>
			),
		},
		{
			key: 'reason',
			header: 'Motivo',
			render: (m) => (
				<span className='max-w-[200px] truncate text-xs text-gray-600' title={m.reason}>
					{m.reason}
				</span>
			),
		},
		{
			key: 'reference',
			header: 'Referencia',
			render: (m) =>
				m.referenceId ? (
					<Chip size='sm' variant='flat' color='default'>
						{m.referenceType}: {m.referenceId.slice(0, 8)}...
					</Chip>
				) : (
					<span className='text-xs text-gray-400'>—</span>
				),
		},
	];

	return (
		<Modal isOpen onClose={onClose} size='3xl' scrollBehavior='inside'>
			<ModalContent>
				<ModalHeader className='flex flex-col gap-1'>
					<span className='text-lg font-semibold'>Historial de movimientos</span>
					<span className='text-sm font-normal text-gray-500'>
						{item.product.title} — Talla: {item.size} — {item.location}
					</span>
				</ModalHeader>
				<ModalBody>
					<DataTable
						columns={movColumns}
						data={data?.data ?? []}
						rowKey={(m) => m.id}
						paginationMeta={data?.meta}
						onPaginationChange={({ page }) => setMovPage(page)}
						isLoading={isLoading}
						emptyMessage='No hay movimientos registrados'
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant='flat' onPress={onClose}>
						Cerrar
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

function VariantsModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
	const [variants, setVariants] = useState<
		Array<{ size: string; color: string; colorName: string; sku: string; inStock: number }>
	>([
		{ size: item.size, color: '#000000', colorName: 'Negro', sku: item.product.sku || '', inStock: item.available },
	]);
	const [newVariant, setNewVariant] = useState({ size: 'M', color: '#000000', colorName: '', sku: '', inStock: 0 });

	const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

	const handleAddVariant = () => {
		if (!newVariant.colorName) return;
		setVariants([...variants, { ...newVariant, sku: newVariant.sku || `${item.product.sku}-${newVariant.size}` }]);
		setNewVariant({ size: 'M', color: '#000000', colorName: '', sku: '', inStock: 0 });
	};

	const handleRemoveVariant = (index: number) => {
		setVariants(variants.filter((_, i) => i !== index));
	};

	return (
		<Modal isOpen onClose={onClose} size='3xl' scrollBehavior='inside'>
			<ModalContent>
				<ModalHeader className='flex flex-col gap-1'>
					<span className='text-lg font-semibold'>Gestionar Variantes</span>
					<span className='text-sm font-normal text-gray-500'>
						{item.product.title} — Tallas y colores disponibles
					</span>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<h4 className='text-sm font-medium'>Variantes Existentes</h4>
							{variants.map((variant, index) => (
								<div key={index} className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
									<div
										className='h-6 w-6 rounded-full border'
										style={{ backgroundColor: variant.color }}
									/>
									<span className='w-20 text-sm font-medium'>{variant.size}</span>
									<span className='flex-1 text-sm'>{variant.colorName}</span>
									<span className='w-24 text-sm text-gray-500'>SKU: {variant.sku}</span>
									<span className='w-16 text-sm font-medium'>{variant.inStock} uds</span>
									<button
										type='button'
										onClick={() => handleRemoveVariant(index)}
										className='text-red-500 hover:text-red-700'
									>
										×
									</button>
								</div>
							))}
						</div>

						<div className='border-t pt-4'>
							<h4 className='mb-3 text-sm font-medium'>Agregar Nueva Variante</h4>
							<div className='grid grid-cols-2 gap-3'>
								<Select
									label='Talla'
									selectedKeys={new Set([newVariant.size])}
									onSelectionChange={(keys) => {
										const value = Array.from(keys as Set<string>)[0];
										if (value) setNewVariant({ ...newVariant, size: value });
									}}
									size='sm'
								>
									{SIZE_OPTIONS.map((size) => (
										<SelectItem key={size}>{size}</SelectItem>
									))}
								</Select>
								<Input
									label='Color (hex)'
									type='color'
									value={newVariant.color}
									onValueChange={(v) => setNewVariant({ ...newVariant, color: v })}
									size='sm'
								/>
								<Input
									label='Nombre del color'
									placeholder='Ej: Rojo, Azul marino...'
									value={newVariant.colorName}
									onValueChange={(v) => setNewVariant({ ...newVariant, colorName: v })}
									size='sm'
								/>
								<Input
									label='SKU'
									placeholder='SKU de la variante'
									value={newVariant.sku}
									onValueChange={(v) => setNewVariant({ ...newVariant, sku: v })}
									size='sm'
								/>
								<Input
									label='Stock inicial'
									type='number'
									value={String(newVariant.inStock)}
									onValueChange={(v) => setNewVariant({ ...newVariant, inStock: parseInt(v) || 0 })}
									size='sm'
								/>
							</div>
							<Button
								color='primary'
								size='sm'
								className='mt-3'
								onPress={handleAddVariant}
								isDisabled={!newVariant.colorName}
							>
								Agregar Variante
							</Button>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='flat' onPress={onClose}>
						Cerrar
					</Button>
					<Button color='primary' onPress={onClose}>
						Guardar Cambios
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
