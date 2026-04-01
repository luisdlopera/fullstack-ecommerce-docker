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
	guestEmail?: string;
};

export function useCheckoutSubmit() {
	const router = useRouter();
	const { user } = useAuth();
	const { items, totalPrice, clearCart } = useCart();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const tax = totalPrice * 0.15;
	const total = totalPrice + tax;

	const validateCartStock = useCallback(async () => {
		setSubmitting(true);
		setError('');
		try {
			const orderItems = items.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
				size: item.size,
			}));

			const res = await bffFetch('/orders/validate-cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: orderItems }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				const msg = (body as { message?: string | string[] }).message;
				const text = typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join('. ') : 'Error al validar el carrito';
				throw new Error(text);
			}

			const validation = (await res.json()) as { valid: boolean; errors: { message: string }[] };
			if (!validation.valid) {
				const errorMsgs = validation.errors.map((e) => e.message).join(' | ');
				throw new Error('Lo sentimos: ' + errorMsgs);
			}
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al verificar disponibilidad');
			return false;
		} finally {
			setSubmitting(false);
		}
	}, [items]);

	const submitAddress = useCallback(
		async (address: CheckoutAddressPayload) => {
			setError('');
			setSubmitting(true);

			const orderItems = items.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
				size: item.size,
			}));

			try {
				if (!user && !address.guestEmail) {
					throw new Error('Debes iniciar sesión o proveer un correo para completar tu compra.');
				}

				const res = await bffFetch('/orders', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ items: orderItems, address, guestEmail: address.guestEmail }),
				});

				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					const msg = (body as { message?: string | string[] }).message;
					const text =
						typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join('. ') : 'Error al crear la orden';
					throw new Error(text);
				}

				const order = (await res.json()) as { id: string; guestCheckoutToken?: string };

				const initPaymentRes = await bffFetch('/payments/mercadopago/init', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ orderId: order.id, guestCheckoutToken: order.guestCheckoutToken }),
				});

				if (!initPaymentRes.ok) {
					throw new Error('Error al inicializar el pago en Mercado Pago');
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

	return {
		submitAddress,
		validateCartStock,
		submitting,
		error,
		totalPrice,
		tax,
		total,
		items,
	};
}
