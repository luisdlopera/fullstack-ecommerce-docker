'use client';

import { useCart } from '@/features/cart';

export function CheckoutOrderSummary({ tax, total }: { tax: number; total: number }) {
	const { items, totalPrice } = useCart();

	return (
		<div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-200'>
			<h2 className='mb-6 pl-1 text-lg font-bold text-gray-900'>Resumen del pedido</h2>
			<div className='flex flex-col gap-4 text-sm'>
				<div className='flex flex-col gap-3 max-h-60 overflow-y-auto pr-2'>
					{items.map((item) => (
						<div key={`${item.productId}-${item.size}`} className='flex justify-between items-center gap-4'>
							<div className='flex items-center gap-3'>
								<div className='relative flex h-16 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={item.image} alt={item.title} className='h-full w-full object-cover' />
									<span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-[10px] font-bold text-white shadow ring-2 ring-white'>
										{item.quantity}
									</span>
								</div>
								<div className='flex flex-col'>
									<span className='font-semibold text-gray-700 line-clamp-1 break-all'>{item.title}</span>
									<span className='text-xs font-medium text-gray-500 uppercase tracking-widest'>{item.size}</span>
								</div>
							</div>
							<span className='font-bold text-gray-900'>${(item.price * item.quantity).toFixed(2)}</span>
						</div>
					))}
				</div>

				<hr className='my-3 border-gray-100' />
				
				<div className='flex justify-between text-gray-500'>
					<span>Subtotal</span>
					<span className='font-semibold text-gray-800'>${totalPrice.toFixed(2)}</span>
				</div>
				<div className='flex justify-between text-gray-500'>
					<span>Impuesto (15%)</span>
					<span className='font-semibold text-gray-800'>${tax.toFixed(2)}</span>
				</div>
				<div className='flex justify-between text-gray-500'>
					<span>Envío</span>
					<span className='font-semibold text-gray-800'>Calculado en el siguiente paso</span>
				</div>
				
				<hr className='my-3 border-gray-100' />
				
				<div className='flex justify-between text-xl font-black text-gray-900'>
					<span>Total</span>
					<span>${total.toFixed(2)}</span>
				</div>
			</div>
		</div>
	);
}
