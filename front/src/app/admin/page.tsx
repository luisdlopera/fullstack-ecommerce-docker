'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DollarSign, ShoppingCart, Users, Package, Clock, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import {
	AdminPageHeader,
	dashboardApi,
	ErrorState,
	LoadingSkeleton,
	StatCard,
	StatusBadge,
	type AdminOrder,
	type TopProduct,
} from '@/features/admin';

const PERIOD_OPTIONS = [
	{ value: '1d', label: 'Hoy' },
	{ value: '7d', label: '7 días' },
	{ value: '30d', label: '30 días' },
	{ value: '12m', label: '12 meses' },
];

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminDashboardPage() {
	const [period, setPeriod] = useState('30d');

	const {
		data: summary,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['admin', 'dashboard', 'summary', period],
		queryFn: () => dashboardApi.getSummary(period),
	});

	const { data: recentOrders } = useQuery({
		queryKey: ['admin', 'dashboard', 'recent-orders'],
		queryFn: () => dashboardApi.getRecentOrders(8),
	});

	const { data: topProducts } = useQuery({
		queryKey: ['admin', 'dashboard', 'top-products'],
		queryFn: () => dashboardApi.getTopProducts(5),
	});

	if (error) {
		return (
			<>
				<AdminPageHeader title='Dashboard' description='Resumen ejecutivo del negocio' />
				<ErrorState message={error.message} onRetry={() => refetch()} />
			</>
		);
	}

	return (
		<>
			<AdminPageHeader
				title='Dashboard'
				description='Resumen ejecutivo del negocio'
				actions={
					<div className='flex gap-1 rounded-lg border border-gray-200 bg-white p-1'>
						{PERIOD_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => setPeriod(opt.value)}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
									period === opt.value ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				}
			/>

			{isLoading ? (
				<LoadingSkeleton type='cards' rows={8} />
			) : summary ? (
				<>
					<div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						<StatCard
							title='Ventas totales'
							value={formatCurrency(summary.totalSales)}
							icon={DollarSign}
							description='Acumulado'
						/>
						<StatCard
							title='Órdenes totales'
							value={summary.totalOrders.toLocaleString()}
							icon={ShoppingCart}
						/>
						<StatCard title='Usuarios' value={summary.totalUsers.toLocaleString()} icon={Users} />
						<StatCard
							title='Productos activos'
							value={summary.activeProducts.toLocaleString()}
							icon={Package}
						/>
						<StatCard title='Ticket promedio' value={formatCurrency(summary.avgTicket)} icon={TrendingUp} />
						<StatCard
							title='Órdenes pendientes'
							value={summary.pendingOrders.toLocaleString()}
							icon={Clock}
						/>
						<StatCard
							title={`Ingresos (${PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period})`}
							value={formatCurrency(summary.periodRevenue)}
							icon={BarChart3}
							description={`${summary.periodOrders} órdenes`}
						/>
						<StatCard
							title='Sin stock'
							value={summary.outOfStock.toLocaleString()}
							icon={AlertTriangle}
							description='Productos agotados'
						/>
					</div>

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
						<RecentOrdersSection orders={recentOrders ?? []} />
						<TopProductsSection products={topProducts ?? []} />
					</div>
				</>
			) : null}
		</>
	);
}

function RecentOrdersSection({ orders }: { orders: AdminOrder[] }) {
	return (
		<div className='rounded-xl border border-gray-200 bg-white'>
			<div className='border-b border-gray-200 px-6 py-4'>
				<h2 className='font-semibold text-gray-900'>Últimas órdenes</h2>
			</div>
			{orders.length === 0 ? (
				<div className='px-6 py-8 text-center text-sm text-gray-500'>Sin órdenes recientes</div>
			) : (
				<div className='divide-y divide-gray-100'>
					{orders.map((order) => (
						<div key={order.id} className='flex items-center justify-between px-6 py-3'>
							<div>
								<p className='text-sm font-medium text-gray-900'>{order.user.name}</p>
								<p className='text-xs text-gray-500'>{formatDate(order.createdAt)}</p>
							</div>
							<div className='flex items-center gap-3'>
								<StatusBadge value={order.status} type='order' />
								<span className='text-sm font-semibold text-gray-900'>
									{formatCurrency(order.total)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function TopProductsSection({ products }: { products: TopProduct[] }) {
	return (
		<div className='rounded-xl border border-gray-200 bg-white'>
			<div className='border-b border-gray-200 px-6 py-4'>
				<h2 className='font-semibold text-gray-900'>Productos más vendidos</h2>
			</div>
			{products.length === 0 ? (
				<div className='px-6 py-8 text-center text-sm text-gray-500'>Sin datos de ventas</div>
			) : (
				<div className='divide-y divide-gray-100'>
					{products.map((item, i) => (
						<div key={item.product?.id ?? i} className='flex items-center gap-4 px-6 py-3'>
							<span className='flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600'>
								{i + 1}
							</span>
							{item.product?.ProductImage?.[0]?.url && (
								<Image
									src={item.product.ProductImage[0].url}
									alt={item.product?.title ?? 'Producto'}
									width={40}
									height={40}
									className='h-10 w-10 rounded-lg object-cover'
								/>
							)}
							<div className='flex-1'>
								<p className='text-sm font-medium text-gray-900'>
									{item.product?.title ?? 'Producto eliminado'}
								</p>
								<p className='text-xs text-gray-500'>{formatCurrency(item.product?.price ?? 0)}</p>
							</div>
							<span className='text-sm font-semibold text-gray-700'>{item.totalSold} uds</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
