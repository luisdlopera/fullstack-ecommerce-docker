'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, X } from 'lucide-react';
import {
	AdminPageHeader,
	DataTable,
	ErrorState,
	FilterSelect,
	ordersApi,
	SearchInput,
	StatusBadge,
	type AdminOrder,
	type Column,
} from '@/features/admin';

const ORDER_STATUS_OPTIONS = [
	{ value: 'PENDING', label: 'Pendiente' },
	{ value: 'PAID', label: 'Pagada' },
	{ value: 'PROCESSING', label: 'Procesando' },
	{ value: 'SHIPPED', label: 'Enviada' },
	{ value: 'DELIVERED', label: 'Entregada' },
	{ value: 'CANCELLED', label: 'Cancelada' },
	{ value: 'REFUNDED', label: 'Reembolsada' },
];

const PAYMENT_STATUS_OPTIONS = [
	{ value: 'PENDING', label: 'Pendiente' },
	{ value: 'PAID', label: 'Pagado' },
	{ value: 'FAILED', label: 'Fallido' },
	{ value: 'REFUNDED', label: 'Reembolsado' },
];

function formatCurrency(value: number) {
	return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(d: string) {
	return new Date(d).toLocaleDateString('es', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function AdminOrdersPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [paymentFilter, setPaymentFilter] = useState('');
	const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['admin', 'orders', page, search, statusFilter, paymentFilter],
		queryFn: () =>
			ordersApi.list({
				page,
				limit: 20,
				search: search || undefined,
				status: statusFilter || undefined,
				paymentStatus: paymentFilter || undefined,
			}),
	});

	const statusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
		onSuccess: () => {
			toast.success('Estado actualizado');
			queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const notesMutation = useMutation({
		mutationFn: ({ id, notes }: { id: string; notes: string }) => ordersApi.updateNotes(id, notes),
		onSuccess: () => {
			toast.success('Notas guardadas');
			queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const columns: Column<AdminOrder>[] = [
		{
			key: 'id',
			header: 'Orden',
			render: (o) => (
				<div>
					<p className='font-mono text-xs font-medium text-gray-900'>{o.id.slice(0, 8)}...</p>
					<p className='text-xs text-gray-500'>{formatDate(o.createdAt)}</p>
				</div>
			),
		},
		{
			key: 'customer',
			header: 'Cliente',
			render: (o) => (
				<div>
					<p className='text-sm font-medium text-gray-900'>{o.user.name}</p>
					<p className='text-xs text-gray-500'>{o.user.email}</p>
				</div>
			),
		},
		{
			key: 'status',
			header: 'Estado',
			render: (o) => (
				<select
					value={o.status}
					onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value })}
					className='rounded border border-gray-200 bg-transparent px-2 py-1 text-xs font-medium'
				>
					{ORDER_STATUS_OPTIONS.map((s) => (
						<option key={s.value} value={s.value}>
							{s.label}
						</option>
					))}
				</select>
			),
		},
		{
			key: 'payment',
			header: 'Pago',
			render: (o) => <StatusBadge value={o.paymentStatus} type='payment' />,
		},
		{
			key: 'items',
			header: 'Items',
			render: (o) => <span>{o.itemsInOrder}</span>,
		},
		{
			key: 'total',
			header: 'Total',
			render: (o) => <span className='font-semibold'>{formatCurrency(o.total)}</span>,
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			render: (o) => (
				<button onClick={() => setDetailOrder(o)} className='rounded-lg p-2 text-gray-500 hover:bg-gray-100'>
					<Eye size={16} />
				</button>
			),
		},
	];

	if (error) {
		return (
			<>
				<AdminPageHeader title='Órdenes' />
				<ErrorState message={(error as Error).message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader title='Órdenes' description='Gestiona los pedidos del ecommerce' />

			<div className='mb-4 flex flex-wrap items-center gap-3'>
				<SearchInput
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder='Buscar por ID, email o nombre...'
				/>
				<FilterSelect
					value={statusFilter}
					onChange={(v) => {
						setStatusFilter(v);
						setPage(1);
					}}
					options={ORDER_STATUS_OPTIONS}
					placeholder='Todos los estados'
				/>
				<FilterSelect
					value={paymentFilter}
					onChange={(v) => {
						setPaymentFilter(v);
						setPage(1);
					}}
					options={PAYMENT_STATUS_OPTIONS}
					placeholder='Estado de pago'
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
				emptyMessage='No se encontraron órdenes'
			/>

			{detailOrder && (
				<OrderDetailDrawer
					order={detailOrder}
					onClose={() => setDetailOrder(null)}
					onSaveNotes={(notes) => notesMutation.mutate({ id: detailOrder.id, notes })}
				/>
			)}
		</>
	);
}

function OrderDetailDrawer({
	order,
	onClose,
	onSaveNotes,
}: {
	order: AdminOrder;
	onClose: () => void;
	onSaveNotes: (notes: string) => void;
}) {
	const [notes, setNotes] = useState(order.internalNotes ?? '');

	return (
		<div className='fixed inset-0 z-50 flex justify-end bg-black/40' onClick={onClose}>
			<div
				className='h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4'>
					<h2 className='text-lg font-semibold'>Detalle de orden</h2>
					<button onClick={onClose} className='rounded-lg p-1 hover:bg-gray-100'>
						<X size={20} />
					</button>
				</div>

				<div className='space-y-6 p-6'>
					<div className='grid grid-cols-2 gap-4'>
						<InfoField label='ID' value={order.id} />
						<InfoField label='Fecha' value={formatDate(order.createdAt)} />
						<InfoField label='Cliente' value={order.user.name} />
						<InfoField label='Email' value={order.user.email} />
						<div>
							<span className='text-xs font-medium text-gray-500'>Estado</span>
							<div className='mt-1'>
								<StatusBadge value={order.status} type='order' />
							</div>
						</div>
						<div>
							<span className='text-xs font-medium text-gray-500'>Pago</span>
							<div className='mt-1'>
								<StatusBadge value={order.paymentStatus} type='payment' />
							</div>
						</div>
					</div>

					<div>
						<h3 className='mb-2 text-sm font-semibold text-gray-900'>Productos</h3>
						<div className='rounded-lg border border-gray-200'>
							{order.OrderItem.map((item) => (
								<div
									key={item.id}
									className='flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0'
								>
									<div>
										<p className='text-sm font-medium'>{item.product?.title ?? 'Producto'}</p>
										<p className='text-xs text-gray-500'>
											Talla: {item.size} | Cant: {item.quantity}
										</p>
									</div>
									<span className='text-sm font-semibold'>
										{formatCurrency(item.price * item.quantity)}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4'>
						<InfoField label='Subtotal' value={formatCurrency(order.subTotal)} />
						<InfoField label='Impuestos' value={formatCurrency(order.tax)} />
						<InfoField label='Total' value={formatCurrency(order.total)} />
						<InfoField label='Transaction ID' value={order.transactionId ?? '—'} />
					</div>

					{order.OrderAddress && (
						<div>
							<h3 className='mb-2 text-sm font-semibold text-gray-900'>Dirección de envío</h3>
							<div className='rounded-lg border border-gray-200 p-4 text-sm text-gray-700'>
								<p>
									{order.OrderAddress.firstName} {order.OrderAddress.lastName}
								</p>
								<p>{order.OrderAddress.address}</p>
								{order.OrderAddress.address2 && <p>{order.OrderAddress.address2}</p>}
								<p>
									{order.OrderAddress.city}, {order.OrderAddress.postalCode}
								</p>
								<p>{order.OrderAddress.country.name}</p>
								<p className='mt-1 text-gray-500'>Tel: {order.OrderAddress.phone}</p>
							</div>
						</div>
					)}

					<div>
						<h3 className='mb-2 text-sm font-semibold text-gray-900'>Notas internas</h3>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black'
							placeholder='Agregar notas internas...'
						/>
						<button
							onClick={() => onSaveNotes(notes)}
							className='mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800'
						>
							Guardar notas
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function InfoField({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<span className='text-xs font-medium text-gray-500'>{label}</span>
			<p className='mt-0.5 text-sm break-all text-gray-900'>{value}</p>
		</div>
	);
}
