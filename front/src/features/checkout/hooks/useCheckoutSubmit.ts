'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart';
import { shopFetch } from '@/lib/shop-api';

export type CheckoutAddressPayload = {
	firstName: string;
	lastName: string;
	address: string;
	address2?: string;
	postalCode: string;
	city: string;
	phone: string;
	countryId: string;
};

export function useCheckoutSubmit() {
	const router = useRouter();
	const { items, totalPrice, clearCart } = useCart();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const tax = totalPrice * 0.15;
	const total = totalPrice + tax;

	const submit = useCallback(
		async (address: CheckoutAddressPayload) => {
			setError('');
			setSubmitting(true);

			const orderItems = items.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
				size: item.size,
			}));

			try {
				const token = typeof window !== 'undefined' ? localStorage.getItem('nexstore-token') : null;

				if (!token) {
					setError('Debes iniciar sesión para completar tu compra.');
					return;
				}

				const res = await shopFetch('/orders', {
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
		},
		[items, clearCart, router],
	);

	return { submit, submitting, error, totalPrice, tax, total, items };
}
