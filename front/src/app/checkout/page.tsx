'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { useCart } from '@/contexts/CartContext';
import { getClientApiUrl, type Country } from '@/lib/api';

export default function CheckoutPage() {
	const router = useRouter();
	const { items, totalPrice, clearCart } = useCart();
	const [countries, setCountries] = useState<Country[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (items.length === 0) {
			router.replace('/cart');
		}
	}, [items.length, router]);

	useEffect(() => {
		const fetchCountries = async () => {
			try {
				const baseUrl = getClientApiUrl();
				const res = await fetch(`${baseUrl}/countries`);
				if (res.ok) setCountries((await res.json()) as Country[]);
			} catch {
				/* ignore */
			}
		};
		fetchCountries();
	}, []);

	const tax = totalPrice * 0.15;
	const total = totalPrice + tax;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setSubmitting(true);

		const form = new FormData(e.currentTarget);
		const address = {
			firstName: form.get('firstName') as string,
			lastName: form.get('lastName') as string,
			address: form.get('address') as string,
			address2: (form.get('address2') as string) || undefined,
			postalCode: form.get('postalCode') as string,
			city: form.get('city') as string,
			phone: form.get('phone') as string,
			countryId: form.get('countryId') as string,
		};

		const orderItems = items.map((item) => ({
			productId: item.productId,
			quantity: item.quantity,
			size: item.size,
		}));

		try {
			const baseUrl = getClientApiUrl();
			const token = typeof window !== 'undefined' ? localStorage.getItem('nexstore-token') : null;

			if (!token) {
				setError('Debes iniciar sesión para completar tu compra.');
				setSubmitting(false);
				return;
			}

			const res = await fetch(`${baseUrl}/orders`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ items: orderItems, address }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error((body as { message?: string }).message || 'Error al crear la orden');
			}

			const order = (await res.json()) as { id: string };
			clearCart();
			router.push(`/checkout/confirmation?orderId=${order.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setSubmitting(false);
		}
	};

	if (items.length === 0) return null;

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-5xl pb-16 text-black'>
			<h1 className='mb-8 text-3xl font-bold'>Checkout</h1>

			<form onSubmit={handleSubmit} className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
				<div className='flex flex-col gap-4 lg:col-span-2'>
					<h2 className='text-xl font-bold'>Dirección de envío</h2>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<Input isRequired name='firstName' label='Nombre' placeholder='Tu nombre' />
						<Input isRequired name='lastName' label='Apellido' placeholder='Tu apellido' />
					</div>
					<Input isRequired name='address' label='Dirección' placeholder='Calle y número' />
					<Input name='address2' label='Dirección 2 (opcional)' placeholder='Apto, suite...' />
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
						<Input isRequired name='city' label='Ciudad' placeholder='Ciudad' />
						<Input isRequired name='postalCode' label='Código postal' placeholder='00000' />
						<Select isRequired name='countryId' label='País' placeholder='Selecciona'>
							{countries.map((c) => (
								<SelectItem key={c.id}>{c.name}</SelectItem>
							))}
						</Select>
					</div>
					<Input isRequired name='phone' label='Teléfono' placeholder='+57 300 000 0000' />

					{error && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</p>}
				</div>

				<div className='rounded-2xl border border-gray-200 p-6'>
					<h2 className='mb-4 text-xl font-bold'>Tu pedido</h2>
					<div className='flex flex-col gap-2 text-sm'>
						{items.map((item) => (
							<div key={`${item.productId}-${item.size}`} className='flex justify-between'>
								<span className='text-gray-600'>
									{item.title} ({item.size}) x{item.quantity}
								</span>
								<span className='font-semibold'>${(item.price * item.quantity).toFixed(2)}</span>
							</div>
						))}
						<hr className='my-2' />
						<div className='flex justify-between'>
							<span className='text-gray-600'>Subtotal</span>
							<span className='font-semibold'>${totalPrice.toFixed(2)}</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Impuesto (15%)</span>
							<span className='font-semibold'>${tax.toFixed(2)}</span>
						</div>
						<hr className='my-2' />
						<div className='flex justify-between text-lg font-bold'>
							<span>Total</span>
							<span>${total.toFixed(2)}</span>
						</div>
					</div>
					<Button
						type='submit'
						color='primary'
						size='lg'
						className='mt-6 w-full font-bold'
						isLoading={submitting}
					>
						Confirmar pedido
					</Button>
				</div>
			</form>
		</main>
	);
}
