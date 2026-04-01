'use client';

import { Button } from '@heroui/react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { CheckoutAddressPayload } from '../hooks/useCheckoutSubmit';

export function StepPayment({
	address,
	onBack,
	onSubmitOrder,
	submitting,
	error,
}: {
	address: CheckoutAddressPayload | null;
	onBack: () => void;
	onSubmitOrder: (address: CheckoutAddressPayload) => void;
	submitting: boolean;
	error: string;
}) {
	if (!address) return null; // Safety check

	return (
		<div className='flex flex-col gap-6 animate-appearance-in'>
			<div className='mb-2 flex items-center justify-between'>
				<Button variant='light' onPress={onBack} startContent={<ArrowLeft size={16} />} className='font-bold -ml-2 text-gray-500'>
					Volver a información
				</Button>
			</div>

			<div className='mb-2'>
				<div className='flex items-center gap-3'>
					<h2 className='text-3xl font-black text-gray-900'>Finalizar Pago</h2>
					<Lock className='text-success' />
				</div>
				<p className='text-gray-500 mt-2 font-medium'>Protegido y seguro a través de Mercado Pago.</p>
			</div>

			<div className='rounded-3xl border border-gray-100 bg-gray-50 p-6'>
				<div className='flex items-center gap-2 mb-4'>
					<ShieldCheck className='text-primary shrink-0' />
					<h3 className='font-bold text-gray-900'>Resumen del envío</h3>
				</div>
				<div className='text-sm text-gray-600 space-y-1.5 bg-white p-4 rounded-2xl ring-1 ring-gray-100 shadow-sm'>
					<p><span className='font-semibold'>Nombre:</span> {address.firstName} {address.lastName}</p>
					<p><span className='font-semibold'>Dirección:</span> {address.address} {address.address2 ? `, ${address.address2}` : ''}</p>
					<p><span className='font-semibold'>Ciudad / CP:</span> {address.city}, {address.postalCode}</p>
					<p><span className='font-semibold'>Teléfono:</span> {address.phone}</p>
				</div>
			</div>

			{error && (
				<div className='rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm mt-2'>
					<div className='flex text-red-600 font-medium text-sm'>
						❌ {error}
					</div>
				</div>
			)}

			<div className='mt-8 pt-6 border-t border-gray-100'>
				<Button
					color='primary'
					size='lg'
					className='w-full font-black tracking-wide h-16 rounded-2xl text-lg shadow-xl shadow-primary/30 transition-all hover:scale-[1.01]'
					onPress={() => onSubmitOrder(address)}
					isLoading={submitting}
				>
					Proceder a Mercado Pago
				</Button>
				<p className='mt-4 text-center text-xs text-gray-400 font-medium'>
					Al continuar, aceptas nuestros términos y condiciones y políticas de privacidad.
					Serás redirigido de forma segura a MercadoPago para completar el pago.
				</p>
			</div>
		</div>
	);
}
