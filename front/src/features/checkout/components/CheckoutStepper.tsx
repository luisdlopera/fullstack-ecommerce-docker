'use client';

import { Check } from 'lucide-react';
import type { CheckoutStep } from '../hooks/useCheckoutFlow';

export function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
	const steps = [
		{ id: 'review', label: '1. Resumen de Carrito' },
		{ id: 'address', label: '2. Información de Envío' },
		{ id: 'payment', label: '3. Pago' },
	];

	const currentIndex = steps.findIndex((s) => s.id === currentStep);

	return (
		<div className='mb-8 w-full border-b border-gray-100 pt-4 pb-8'>
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
											? 'font-semibold text-gray-800'
											: 'font-medium text-gray-400'
								}`}
							>
								{isPast ? (
									<div className='bg-success flex h-6 w-6 items-center justify-center rounded-full text-white'>
										<Check size={14} strokeWidth={3} />
									</div>
								) : isActive ? (
									<div className='bg-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white'>
										{index + 1}
									</div>
								) : (
									<div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500'>
										{index + 1}
									</div>
								)}
								<span className='hidden sm:inline'>{step.label.replace(/^\d+\.\s*/, '')}</span>
								<span className='text-[10px] font-extrabold tracking-wider uppercase sm:hidden'>
									{step.label.replace(/^\d+\.\s*/, '')}
								</span>
							</div>

							{index < steps.length - 1 && (
								<div className='mx-2 flex w-8 items-center justify-center overflow-hidden text-gray-300 sm:w-16 lg:w-24'>
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
