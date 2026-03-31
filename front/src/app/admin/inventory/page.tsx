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
	TrendingDown,
	Warehouse,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
	AdminPageHeader,
	DataTable,
	ErrorState,
	inventoryApi,
	PERMISSIONS,
	SearchInput,
	StatCard,
	StatusBadge,
	type Column,
	type InventoryItem,
	type InventoryMovement,
} from '@/features/admin';

/* ─── Movement Type Labels ───────────────────────────────────────────── */

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

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function AdminInventoryPage() {
	const { hasPermission } = usePermissions();
	const canAdjust = hasPermission(PERMISSIONS.INVENTORY_ADJUST);
	const queryClient = useQueryClient();

	/* ── State ───────────────────────────────────────────────────────── */

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('');
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
	const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
	const [movementsItem, setMovementsItem] = useState<InventoryItem | null>(null);
	const [adjustQty, setAdjustQty] = useState('');
	const [adjustReason, setAdjustReason] = useState('');

	/* ── Queries ─────────────────────────────────────────────────────── */

	const { data: summary } = useQuery({
		queryKey: ['admin', 'inventory', 'summary'],
		queryFn: () => inventoryApi.getSummary(),
	});

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'inventory', 'items', page, search, filter],
		queryFn: () =>
			inventoryApi.listItems({
				page,
				limit: 20,
				search: search || undefined,
				lowStock: filter === 'lowStock' ? true : undefined,
				outOfStock: filter === 'outOfStock' ? true : undefined,
			}),
	});

	const { data: lowStockItems } = useQuery({
		queryKey: ['admin', 'inventory', 'low-stock'],
		queryFn: () => inventoryApi.getLowStock(),
	});

	/* ── Adjust Mutation ────────────────────────────────────────────── */

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

	/* ── Columns ─────────────────────────────────────────────────────── */

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
				<Chip size='sm' variant='flat' color='default' startContent={<Warehouse size={10} />}>
					{item.location}
				</Chip>
			),
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
					{canAdjust && (
						<button
							type='button'
							onClick={() => setAdjustItem(item)}
							className='rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50'
						>
							Ajustar
						</button>
					)}
				</div>
			),
		},
	];

	/* ── Error state ─────────────────────────────────────────────────── */

	if (error) {
		return (
			<>
				<AdminPageHeader title='Inventario' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	/* ── Render ──────────────────────────────────────────────────────── */

	return (
		<>
			<AdminPageHeader
				title='Inventario'
				description='Gestión operativa de stock por producto y variante'
			/>

			{/* ─── Summary Cards ──────────────────────────────────────────── */}
			<div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
				<StatCard
					title='Ítems registrados'
					value={summary?.totalItems ?? 0}
					icon={Boxes}
				/>
				<StatCard
					title='Disponible total'
					value={summary?.totalAvailable ?? 0}
					icon={ArrowUpCircle}
				/>
				<StatCard
					title='Reservado'
					value={summary?.totalReserved ?? 0}
					icon={Clock}
				/>
				<StatCard
					title='Comprometido'
					value={summary?.totalCommitted ?? 0}
					icon={ArrowDownCircle}
				/>
				<StatCard
					title='Stock bajo'
					value={summary?.lowStockCount ?? 0}
					icon={TrendingDown}
				/>
				<StatCard
					title='Agotados'
					value={summary?.outOfStockCount ?? 0}
					icon={PackageX}
				/>
			</div>

			{/* ─── Low Stock Alert Banner ─────────────────────────────────── */}
			{(lowStockItems?.length ?? 0) > 0 && (
				<Card shadow='none' className='mb-6 border border-amber-200 bg-amber-50'>
					<CardBody className='flex flex-row items-center gap-3 px-4 py-3'>
						<AlertTriangle size={18} className='flex-shrink-0 text-amber-600' />
						<div className='flex-1'>
							<p className='text-sm font-semibold text-amber-800'>
								{lowStockItems!.length} producto(s) con stock bajo
							</p>
							<p className='mt-0.5 text-xs text-amber-700'>
								{lowStockItems!.slice(0, 3).map((i) => `${i.product.title} (${i.size})`).join(', ')}
								{lowStockItems!.length > 3 && ` y ${lowStockItems!.length - 3} más...`}
							</p>
						</div>
						<Button
							size='sm'
							variant='flat'
							color='warning'
							onPress={() => {
								setFilter('lowStock');
								setPage(1);
							}}
						>
							Ver todos
						</Button>
					</CardBody>
				</Card>
			)}

			{/* ─── Search & Filters ──────────────────────────────────────── */}
			<div className='mb-4 flex flex-wrap items-center gap-3'>
				<SearchInput
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
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
						setPage(1);
					}}
					aria-label='Filtro de stock'
				>
					{FILTER_OPTIONS.map((opt) => (
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

			{/* ─── Table ─────────────────────────────────────────────────── */}
			<DataTable
				columns={columns}
				data={data?.data ?? []}
				page={page}
				totalPages={data?.meta.totalPages ?? 1}
				total={data?.meta.total}
				onPageChange={setPage}
				isLoading={isLoading}
				emptyMessage='No se encontraron ítems de inventario'
				selectable
				rowKey={(item) => item.id}
				selectedKeys={selectedKeys}
				onSelectionChange={setSelectedKeys}
			/>

			{/* ─── Adjust Modal ──────────────────────────────────────────── */}
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

			{/* ─── Movements Modal ───────────────────────────────────────── */}
			{movementsItem && (
				<MovementsModal
					item={movementsItem}
					onClose={() => setMovementsItem(null)}
				/>
			)}
		</>
	);
}

/* ─── Movements Modal Component ──────────────────────────────────────── */

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
					{m.quantity > 0 ? '+' : ''}{m.quantity}
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
						page={movPage}
						totalPages={data?.meta.totalPages ?? 1}
						total={data?.meta.total}
						onPageChange={setMovPage}
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
