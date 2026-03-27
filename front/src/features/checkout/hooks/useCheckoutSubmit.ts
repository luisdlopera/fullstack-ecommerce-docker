'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart';
import { useAuth } from '@/contexts/AuthContext';
import { bffFetch } from '@/lib/bff-fetch';

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
	const { user } = useAuth();
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
				if (!user) {
					setError('Debes iniciar sesión para completar tu compra.');
					return;
				}

				const res = await bffFetch('/orders', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ items: orderItems, address }),
				});

				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					const msg = (body as { message?: string | string[] }).message;
					const text =
						typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join('. ') : 'Error al crear la orden';
					throw new Error(text);
				}

				const order = (await res.json()) as { id: string };

				const initPaymentRes = await bffFetch('/payments/mercadopago/init', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ orderId: order.id }),
				});

				if (!initPaymentRes.ok) {
					const body = await initPaymentRes.json().catch(() => ({}));
					const msg = (body as { message?: string | string[] }).message;
					const text =
						typeof msg === 'string'
							? msg
							: Array.isArray(msg)
								? msg.join('. ')
								: 'Error al inicializar el pago';
					throw new Error(text);
				}

				const initPayment = (await initPaymentRes.json()) as {
					checkoutUrl?: string;
					alreadyPaid?: boolean;
				};

				if (initPayment.alreadyPaid) {
					clearCart();
					router.push(`/checkout/confirmation?orderId=${order.id}&status=approved`);
					return;
				}

				if (!initPayment.checkoutUrl) {
					throw new Error('Mercado Pago no devolvió URL de checkout');
				}

				clearCart();
				window.location.assign(initPayment.checkoutUrl);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error inesperado');
			} finally {
				setSubmitting(false);
			}
		},
		[items, clearCart, router, user],
	);

	return { submit, submitting, error, totalPrice, tax, total, items };
}
