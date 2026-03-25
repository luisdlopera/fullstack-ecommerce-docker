'use client';

import { Button, Image } from '@heroui/react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
	const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

	if (items.length === 0) {
		return (
			<main className='mx-auto mt-28 flex w-11/12 max-w-4xl flex-col items-center gap-6 pb-16 text-black'>
				<ShoppingCart size={64} className='text-gray-300' />
				<h1 className='text-2xl font-bold'>Tu carrito está vacío</h1>
				<p className='text-gray-500'>Agrega productos para comenzar tu compra.</p>
				<Button as={Link} href='/' color='primary' size='lg'>
					Ir a la tienda
				</Button>
			</main>
		);
	}

	const tax = totalPrice * 0.15;
	const total = totalPrice + tax;

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-6xl pb-16 text-black'>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-3xl font-bold'>Carrito ({totalItems})</h1>
				<Button variant='light' color='danger' onPress={clearCart} startContent={<Trash2 size={16} />}>
					Vaciar carrito
				</Button>
			</div>

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
				<div className='flex flex-col gap-4 lg:col-span-2'>
					{items.map((item) => (
						<div
							key={`${item.productId}-${item.size}`}
							className='flex gap-4 rounded-2xl border border-gray-200 p-4'
						>
							<Link href={`/products/${item.slug}`}>
								<Image
									src={item.image}
									alt={item.title}
									className='h-28 w-28 rounded-xl object-cover'
								/>
							</Link>
							<div className='flex flex-1 flex-col justify-between'>
								<div>
									<Link href={`/products/${item.slug}`} className='text-lg font-semibold hover:underline'>
										{item.title}
									</Link>
									<p className='text-sm text-gray-500'>Talla: {item.size}</p>
								</div>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Button
											isIconOnly
											size='sm'
											variant='bordered'
											onPress={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
											isDisabled={item.quantity <= 1}
										>
											<Minus size={14} />
										</Button>
										<span className='w-6 text-center font-semibold'>{item.quantity}</span>
										<Button
											isIconOnly
											size='sm'
											variant='bordered'
											onPress={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
										>
											<Plus size={14} />
										</Button>
									</div>
									<p className='text-lg font-bold'>${(item.price * item.quantity).toFixed(2)}</p>
									<Button
										isIconOnly
										size='sm'
										variant='light'
										color='danger'
										onPress={() => removeItem(item.productId, item.size)}
									>
										<Trash2 size={16} />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className='rounded-2xl border border-gray-200 p-6'>
					<h2 className='mb-4 text-xl font-bold'>Resumen</h2>
					<div className='flex flex-col gap-3 text-sm'>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Subtotal ({totalItems} productos)</span>
							<span className='font-semibold'>${totalPrice.toFixed(2)}</span>
						</div>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Impuesto (15%)</span>
							<span className='font-semibold'>${tax.toFixed(2)}</span>
						</div>
						<hr />
						<div className='flex justify-between text-lg font-bold'>
							<span>Total</span>
							<span>${total.toFixed(2)}</span>
						</div>
					</div>
					<Button as={Link} href='/checkout' color='primary' size='lg' className='mt-6 w-full font-bold'>
						Proceder al pago
					</Button>
				</div>
			</div>
		</main>
	);
}
