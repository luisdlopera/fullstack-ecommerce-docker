'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Spinner } from '@heroui/react';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { bffFetch } from '@/lib/bff-fetch';

type OrderSummary = {
	id: string;
	total: number;
	itemsInOrder: number;
	isPaid: boolean;
	createdAt: string;
};

export default function OrdersPage() {
	const { user, loading: authLoading } = useAuth();
	const router = useRouter();
	const [orders, setOrders] = useState<OrderSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/auth');
		}
	}, [user, authLoading, router]);

	useEffect(() => {
		if (!user) return;
		const fetchOrders = async () => {
			try {
				const res = await bffFetch('/orders?limit=50');
				if (res.ok) setOrders((await res.json()) as OrderSummary[]);
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		};
		fetchOrders();
	}, [user]);

	if (authLoading || !user) {
		return (
			<main className='flex min-h-screen items-center justify-center'>
				<Spinner size='lg' />
			</main>
		);
	}

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-4xl pb-16 text-black'>
			<Button
				variant='light'
				onPress={() => router.push('/account')}
				startContent={<ArrowLeft size={18} />}
				className='mb-6 text-black'
			>
				Mi cuenta
			</Button>

			<div className='mb-8'>
				<h1 className='text-3xl font-bold'>Mis Pedidos</h1>
				{user.role === 'USER' && (
					<p className='mt-1 text-sm text-gray-600'>Área cliente: historial de compras en la tienda.</p>
				)}
			</div>

			{loading && (
				<div className='flex justify-center py-20'>
					<Spinner size='lg' />
				</div>
			)}

			{!loading && orders.length === 0 && (
				<div className='flex flex-col items-center gap-4 py-20'>
					<Package size={64} className='text-gray-300' />
					<p className='text-lg text-gray-500'>No tienes pedidos aún.</p>
					<Button as={Link} href='/' color='primary'>
						Ir a la tienda
					</Button>
				</div>
			)}

			{!loading && orders.length > 0 && (
				<div className='flex flex-col gap-4'>
					{orders.map((order) => (
						<Link
							key={order.id}
							href={`/orders/${order.id}`}
							className='flex items-center justify-between rounded-2xl border border-gray-200 p-5 transition-colors hover:bg-gray-50'
						>
							<div>
								<p className='font-mono text-sm text-gray-500'>{order.id.slice(0, 8)}...</p>
								<p className='text-sm text-gray-500'>
									{new Date(order.createdAt).toLocaleDateString('es-CO', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									})}
								</p>
								<p className='text-sm text-gray-600'>{order.itemsInOrder} productos</p>
							</div>
							<div className='flex items-center gap-4'>
								<Chip color={order.isPaid ? 'success' : 'warning'} variant='flat'>
									{order.isPaid ? 'Pagado' : 'Pendiente'}
								</Chip>
								<span className='text-lg font-bold'>${order.total.toFixed(2)}</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</main>
	);
}
