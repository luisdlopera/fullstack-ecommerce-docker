'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { useCart } from '@/features/cart';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function StepCartReview({
	onNext,
	onValidate,
	submitting,
	error,
}: {
	onNext: () => void;
	onValidate: () => Promise<boolean>;
	submitting: boolean;
	error: string;
}) {
	const { items, updateQuantity, removeItem } = useCart();
	const [localError, setLocalError] = useState('');

	const handleProceed = async () => {
		setLocalError('');
		const isValid = await onValidate();
		if (isValid) {
			onNext();
		} else {
			setLocalError(
				'No hay suficiente stock para algunos productos en tu carrito. Por favor, ajusta las cantidades.',
			);
		}
	};

	return (
		<div className='animate-appearance-in flex flex-col gap-6'>
			<div className='mb-4'>
				<h2 className='text-2xl font-black text-gray-900'>Revisa tu carrito</h2>
				<p className='mt-1 text-gray-500'>
					Asegúrate de que las tallas y cantidades sean correctas antes de continuar.
				</p>
			</div>

			<div className='flex flex-col gap-5'>
				{items.map((item) => (
					<div
						key={`${item.productId}-${item.size}`}
						className='group flex gap-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md'
					>
						<div className='h-32 w-28 shrink-0 overflow-hidden rounded-2xl'>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={item.image}
								alt={item.title}
								className='h-full w-full object-cover transition-transform group-hover:scale-105'
							/>
						</div>
						<div className='flex flex-1 flex-col py-1'>
							<div className='flex items-start justify-between gap-2'>
								<Link
									href={`/products/${item.slug}`}
									className='hover:text-primary line-clamp-2 text-base leading-tight font-bold transition-colors'
								>
									{item.title}
								</Link>
								<Button
									isIconOnly
									size='sm'
									variant='light'
									color='danger'
									className='-mt-1.5 -mr-1.5 h-8 w-8 min-w-8 opacity-60 hover:opacity-100'
									onPress={() => removeItem(item.productId, item.size)}
									aria-label='Eliminar producto'
								>
									<Trash2 size={16} />
								</Button>
							</div>
							<p className='mt-1 text-sm font-semibold tracking-wider text-gray-500 uppercase'>
								Talla: {item.size}
							</p>

							<div className='mt-auto flex items-center justify-between pt-2'>
								<p className='text-foreground text-xl font-black'>${item.price.toFixed(2)}</p>
								<div className='flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-inner'>
									<Button
										isIconOnly
										size='sm'
										variant='light'
										className='h-8 w-8 min-w-8 border border-gray-100 bg-white text-gray-700 shadow-sm'
										onPress={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
										isDisabled={item.quantity <= 1}
									>
										<Minus size={14} />
									</Button>
									<span className='w-6 text-center text-sm font-bold text-gray-900'>
										{item.quantity}
									</span>
									<Button
										isIconOnly
										size='sm'
										variant='light'
										className='h-8 w-8 min-w-8 border border-gray-100 bg-white text-gray-700 shadow-sm'
										onPress={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
									>
										<Plus size={14} />
									</Button>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{(error || localError) && (
				<div className='rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm'>
					<div className='flex text-sm font-medium text-red-600'>✨ {error || localError}</div>
				</div>
			)}

			<div className='mt-6 border-t border-gray-100 pt-8 pb-4'>
				<Button
					color='primary'
					size='lg'
					className='shadow-primary/20 h-14 w-full rounded-2xl text-lg font-black tracking-wide shadow-xl'
					onPress={handleProceed}
					isLoading={submitting}
				>
					Continuar a información de envío
				</Button>
			</div>
		</div>
	);
}
