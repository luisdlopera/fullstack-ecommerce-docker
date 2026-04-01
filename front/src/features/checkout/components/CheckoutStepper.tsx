'use client';

import { Check, Dot } from 'lucide-react';
import type { CheckoutStep } from '../hooks/useCheckoutFlow';

export function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
	const steps = [
		{ id: 'review', label: '1. Resumen de Carrito' },
		{ id: 'address', label: '2. Información de Envío' },
		{ id: 'payment', label: '3. Pago' },
	];

	const currentIndex = steps.findIndex((s) => s.id === currentStep);

	return (
		<div className='mb-8 w-full border-b border-gray-100 pb-8 pt-4'>
			<div className='flex items-center justify-between lg:justify-center lg:gap-8'>
				{steps.map((step, index) => {
					const isActive = step.id === currentStep;
					const isPast = index < currentIndex;

					return (
						<div key={step.id} className='flex items-center'>
							<div
								className={`flex items-center justify-center gap-2 ${
									isActive
										? 'text-primary font-bold'
										: isPast
											? 'text-gray-800 font-semibold'
											: 'text-gray-400 font-medium'
								}`}
							>
								{isPast ? (
									<div className='flex h-6 w-6 items-center justify-center rounded-full bg-success text-white'>
										<Check size={14} strokeWidth={3} />
									</div>
								) : isActive ? (
									<div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold'>
										{index + 1}
									</div>
								) : (
									<div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs font-bold'>
										{index + 1}
									</div>
								)}
								<span className='hidden sm:inline'>{step.label.replace(/^\d+\.\s*/, '')}</span>
								<span className='sm:hidden uppercase text-[10px] tracking-wider font-extrabold'>{step.label.replace(/^\d+\.\s*/, '')}</span>
							</div>

							{index < steps.length - 1 && (
								<div className='mx-2 flex w-8 sm:w-16 items-center justify-center overflow-hidden text-gray-300 lg:w-24'>
									<div className={`h-[2px] w-full ${isPast ? 'bg-success' : 'bg-gray-200'}`} />
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
