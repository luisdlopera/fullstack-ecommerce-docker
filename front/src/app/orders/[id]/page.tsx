'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Chip, Spinner } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getClientApiUrl } from '@/lib/api';

type OrderDetail = {
	id: string;
	subTotal: number;
	tax: number;
	total: number;
	itemsInOrder: number;
	isPaid: boolean;
	paidAt: string | null;
	createdAt: string;
	OrderItem: {
		id: string;
		quantity: number;
		price: number;
		size: string;
		product: { title: string; slug: string };
	}[];
	OrderAddress: {
		firstName: string;
		lastName: string;
		address: string;
		address2?: string;
		city: string;
		postalCode: string;
		phone: string;
		country: { name: string };
	} | null;
};

export default function OrderDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { user, token, loading: authLoading } = useAuth();
	const [order, setOrder] = useState<OrderDetail | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/auth');
		}
	}, [user, authLoading, router]);

	useEffect(() => {
		if (!token) return;
		const fetchOrder = async () => {
			try {
				const baseUrl = getClientApiUrl();
				const res = await fetch(`${baseUrl}/orders/${params.id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) setOrder((await res.json()) as OrderDetail);
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		};
		fetchOrder();
	}, [token, params.id]);

	if (authLoading || loading) {
		return (
			<main className='flex min-h-screen items-center justify-center'>
				<Spinner size='lg' />
			</main>
		);
	}

	if (!order) {
		return (
			<main className='mx-auto mt-28 flex w-11/12 max-w-4xl flex-col items-center gap-4 pb-16 text-black'>
				<h1 className='text-2xl font-bold'>Pedido no encontrado</h1>
				<Button onPress={() => router.push('/orders')} color='primary'>
					Ver mis pedidos
				</Button>
			</main>
		);
	}

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-4xl pb-16 text-black'>
			<Button
				variant='light'
				onPress={() => router.push('/orders')}
				startContent={<ArrowLeft size={18} />}
				className='mb-6 text-black'
			>
				Mis pedidos
			</Button>

			<div className='mb-6 flex items-center gap-4'>
				<h1 className='text-3xl font-bold'>Pedido</h1>
				<Chip color={order.isPaid ? 'success' : 'warning'} variant='flat'>
					{order.isPaid ? 'Pagado' : 'Pendiente'}
				</Chip>
			</div>

			<p className='mb-6 text-sm text-gray-500'>
				Creado el{' '}
				{new Date(order.createdAt).toLocaleDateString('es-CO', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}
			</p>

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
				<div>
					<h2 className='mb-4 text-xl font-bold'>Productos</h2>
					<div className='flex flex-col gap-3'>
						{order.OrderItem.map((item) => (
							<div key={item.id} className='flex justify-between rounded-xl border border-gray-200 p-4'>
								<div>
									<p className='font-semibold'>{item.product.title}</p>
									<p className='text-sm text-gray-500'>
										Talla: {item.size} &middot; Cantidad: {item.quantity}
									</p>
								</div>
								<p className='font-bold'>${(item.price * item.quantity).toFixed(2)}</p>
							</div>
						))}
					</div>
				</div>

				<div className='flex flex-col gap-6'>
					<div className='rounded-2xl border border-gray-200 p-6'>
						<h2 className='mb-4 text-xl font-bold'>Resumen</h2>
						<div className='flex flex-col gap-2 text-sm'>
							<div className='flex justify-between'>
								<span className='text-gray-600'>Subtotal</span>
								<span className='font-semibold'>${order.subTotal.toFixed(2)}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-gray-600'>Impuesto</span>
								<span className='font-semibold'>${order.tax.toFixed(2)}</span>
							</div>
							<hr />
							<div className='flex justify-between text-lg font-bold'>
								<span>Total</span>
								<span>${order.total.toFixed(2)}</span>
							</div>
						</div>
					</div>

					{order.OrderAddress && (
						<div className='rounded-2xl border border-gray-200 p-6'>
							<h2 className='mb-4 text-xl font-bold'>Dirección de envío</h2>
							<div className='text-sm text-gray-600'>
								<p className='font-semibold text-black'>
									{order.OrderAddress.firstName} {order.OrderAddress.lastName}
								</p>
								<p>{order.OrderAddress.address}</p>
								{order.OrderAddress.address2 && <p>{order.OrderAddress.address2}</p>}
								<p>
									{order.OrderAddress.city}, {order.OrderAddress.postalCode}
								</p>
								<p>{order.OrderAddress.country.name}</p>
								<p>{order.OrderAddress.phone}</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
