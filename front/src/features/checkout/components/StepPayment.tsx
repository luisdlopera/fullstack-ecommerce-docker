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
		<div className='animate-appearance-in flex flex-col gap-6'>
			<div className='mb-2 flex items-center justify-between'>
				<Button
					variant='light'
					onPress={onBack}
					startContent={<ArrowLeft size={16} />}
					className='-ml-2 font-bold text-gray-500'
				>
					Volver a información
				</Button>
			</div>

			<div className='mb-2'>
				<div className='flex items-center gap-3'>
					<h2 className='text-3xl font-black text-gray-900'>Finalizar Pago</h2>
					<Lock className='text-success' />
				</div>
				<p className='mt-2 font-medium text-gray-500'>Protegido y seguro a través de Mercado Pago.</p>
			</div>

			<div className='rounded-3xl border border-gray-100 bg-gray-50 p-6'>
				<div className='mb-4 flex items-center gap-2'>
					<ShieldCheck className='text-primary shrink-0' />
					<h3 className='font-bold text-gray-900'>Resumen del envío</h3>
				</div>
				<div className='space-y-1.5 rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm ring-1 ring-gray-100'>
					<p>
						<span className='font-semibold'>Nombre:</span> {address.firstName} {address.lastName}
					</p>
					<p>
						<span className='font-semibold'>Dirección:</span> {address.address}{' '}
						{address.address2 ? `, ${address.address2}` : ''}
					</p>
					<p>
						<span className='font-semibold'>Ciudad / CP:</span> {address.city}, {address.postalCode}
					</p>
					<p>
						<span className='font-semibold'>Teléfono:</span> {address.phone}
					</p>
				</div>
			</div>

			{error && (
				<div className='mt-2 rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm'>
					<div className='flex text-sm font-medium text-red-600'>❌ {error}</div>
				</div>
			)}

			<div className='mt-8 border-t border-gray-100 pt-6'>
				<Button
					color='primary'
					size='lg'
					className='shadow-primary/30 h-16 w-full rounded-2xl text-lg font-black tracking-wide shadow-xl transition-all hover:scale-[1.01]'
					onPress={() => onSubmitOrder(address)}
					isLoading={submitting}
				>
					Proceder a Mercado Pago
				</Button>
				<p className='mt-4 text-center text-xs font-medium text-gray-400'>
					Al continuar, aceptas nuestros términos y condiciones y políticas de privacidad. Serás redirigido de
					forma segura a MercadoPago para completar el pago.
				</p>
			</div>
		</div>
	);
}
