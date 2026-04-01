'use client';

import {
	Button,
	Drawer,
	DrawerBody,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	Image,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Checkbox,
} from '@heroui/react';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '../context/CartContext';

export function CartDrawer() {
	const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
	const router = useRouter();
	const { user } = useAuth();

	const [itemToRemove, setItemToRemove] = useState<{ productId: string; size: string } | null>(null);
	const [dontShowAgainLocal, setDontShowAgainLocal] = useState(false);
	const [dontShowAgainSession, setDontShowAgainSession] = useState(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('nexstore_skip_cart_remove') === 'true';
		}
		return false;
	});
	
	const [showAuthModal, setShowAuthModal] = useState(false);

	const handleRemoveClick = (productId: string, size: string) => {
		if (dontShowAgainSession) {
			removeItem(productId, size);
		} else {
			setItemToRemove({ productId, size });
			setDontShowAgainLocal(false); // reset local checkbox
		}
	};

	const confirmRemove = () => {
		if (!itemToRemove) return;
		if (dontShowAgainLocal) {
			localStorage.setItem('nexstore_skip_cart_remove', 'true');
			setDontShowAgainSession(true);
		}
		removeItem(itemToRemove.productId, itemToRemove.size);
		setItemToRemove(null);
	};

	const handleCheckoutClick = () => {
		if (!user) {
			setShowAuthModal(true);
			return;
		}
		closeCart();
		router.push('/checkout');
	};

	return (
		<>
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && closeCart()} placement='right' size='md'>
			<DrawerContent>
				{(onClose) => (
					<>
						<DrawerHeader className='flex flex-col gap-1 border-b pb-4 mt-6'>
							<h2 className='text-3xl font-extrabold tracking-tight'>Mi Compra</h2>
							<p className='text-sm text-gray-400'>{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'} total</p>
						</DrawerHeader>
						<DrawerBody className='py-6 bg-gray-50/30'>
							{items.length === 0 ? (
								<div className='flex h-full flex-col items-center justify-center gap-6 text-center animate-appearance-in'>
									<div className='bg-primary/10 rounded-full p-8 text-primary'>
										<ShoppingCart size={56} opacity={0.8} />
									</div>
									<h3 className='text-lg font-bold text-gray-700'>Tu carrito se siente ligero</h3>
									<Button color='primary' className='font-bold shadow-lg shadow-primary/30 mt-4 px-8' size='lg' onPress={onClose}>
										Descubrir novedades
									</Button>
								</div>
							) : (
								<div className='flex flex-col gap-5 overflow-visible'>
									{items.map((item) => (
										<div
											key={`${item.productId}-${item.size}`}
											className='group flex gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md'
										>
											<div className='overflow-hidden rounded-xl'>
												<Image
													src={item.image}
													alt={item.title}
													className='h-28 w-24 object-cover transition-transform group-hover:scale-105'
													radius='none'
												/>
											</div>
											<div className='flex flex-1 flex-col py-1'>
												<div className='flex justify-between items-start gap-2'>
													<Link
														href={`/products/${item.slug}`}
														className='line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary transition-colors'
														onClick={closeCart}
													>
														{item.title}
													</Link>
													<Button
														isIconOnly
														size='sm'
														variant='light'
														color='danger'
														className='-mt-1.5 -mr-1.5 min-w-8 w-8 h-8 opacity-60 hover:opacity-100'
														onPress={() => handleRemoveClick(item.productId, item.size)}
														aria-label='Eliminar producto'
													>
														<Trash2 size={16} />
													</Button>
												</div>
												<p className='mt-1 text-xs text-gray-500 uppercase font-semibold tracking-wider'>Talla: {item.size}</p>
												
												<div className='mt-auto flex items-center justify-between pt-2'>
													<p className='text-lg font-extrabold text-foreground'>${item.price.toFixed(2)}</p>
													<div className='flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5 border border-gray-200 shadow-sm'>
														<Button
															isIconOnly
															size='sm'
															variant='light'
															className='h-7 w-7 min-w-7 text-gray-600'
															onPress={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
															isDisabled={item.quantity <= 1}
														>
															<Minus size={14} />
														</Button>
														<span className='w-4 text-center text-sm font-bold text-gray-800'>{item.quantity}</span>
														<Button
															isIconOnly
															size='sm'
															variant='light'
															className='h-7 w-7 min-w-7 text-gray-600'
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
							)}
						</DrawerBody>
						{items.length > 0 && (
							<DrawerFooter className='flex-col border-t bg-white pt-6 pb-8'>
								<div className='mb-6 flex w-full flex-col gap-2'>
									<div className='flex justify-between items-end'>
										<span className='font-bold text-gray-500 text-sm tracking-wide uppercase'>Subtotal</span>
										<span className='text-2xl font-black text-foreground'>${totalPrice.toFixed(2)}</span>
									</div>
									<p className='text-xs text-gray-400 text-right'>Envío e impuestos asginados en el checkout.</p>
								</div>
								<Button color='primary' className='w-full font-bold text-lg shadow-xl shadow-primary/30 h-14 rounded-2xl' onPress={handleCheckoutClick}>
									Proceder al Pago
								</Button>
							</DrawerFooter>
						)}
					</>
				)}
			</DrawerContent>
		</Drawer>

		{/* Remove Item Alert Dialog */}
		<Modal isOpen={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)} size='sm' placement='center' backdrop='opaque'>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader>Quitar producto</ModalHeader>
						<ModalBody>
							<p className='text-gray-600 text-sm'>
								¿Deseas quitar este producto de tu carrito de compra?
							</p>
							<div className='mt-2'>
								<Checkbox 
									isSelected={dontShowAgainLocal} 
									onValueChange={setDontShowAgainLocal}
									size='sm'
									classNames={{ label: 'text-xs text-gray-500' }}
								>
									No volver a mostrar este mensaje
								</Checkbox>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button variant='flat' onPress={onClose} size='sm' className='font-medium'>
								Cancelar
							</Button>
							<Button color='danger' onPress={confirmRemove} size='sm' className='font-bold'>
								Quitar
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>

		{/* Auth Required Modal */}
		<Modal isOpen={showAuthModal} onOpenChange={setShowAuthModal} size='md' placement='center' backdrop='blur' classNames={{ base: 'p-2' }}>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className='flex flex-col gap-1 items-center pb-2 pt-6 text-center'>
							<div className='bg-primary/10 rounded-full p-4 text-primary mb-2'>
								<UserCircle2 size={40} />
							</div>
							<h3 className='text-xl font-bold'>Inicia sesión para continuar</h3>
							<p className='text-sm font-normal text-gray-500 px-4'>
								Necesitamos tu información de envío para poder completar el pedido.
							</p>
						</ModalHeader>
						<ModalBody className='py-4'>
							<div className='flex flex-col gap-3'>
								<Button 
									color='primary' 
									className='w-full font-bold h-12 text-md shadow-md' 
									onPress={() => {
										onClose();
										closeCart();
										router.push('/auth?redirect=/checkout');
									}}
								>
									Iniciar Sesión
								</Button>
								<Button 
									variant='flat'
									color='default'
									className='w-full font-bold h-12 text-md' 
									onPress={() => {
										onClose();
										closeCart();
										router.push('/auth?redirect=/checkout');
									}}
								>
									Registrar mi cuenta
								</Button>
							</div>
							
							<div className='mt-5 relative'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-gray-100'></div>
								</div>
								<div className='relative flex justify-center text-sm'>
									<span className='bg-white px-2 text-gray-400 text-xs uppercase tracking-widest font-semibold'>Invitado</span>
								</div>
							</div>
							
							<div className='mt-3 flex flex-col'>
								<Button 
									variant='ghost'
									color='primary'
									className='w-full font-bold h-12 text-md border-primary/20 bg-primary/5 hover:bg-primary/10' 
									onPress={() => {
										onClose();
										closeCart();
										router.push('/checkout?guest=true');
									}}
								>
									Continuar como invitado
								</Button>
								<p className='text-[11px] text-gray-400 text-center mt-3 px-2'>
									Podrás ingresar tu email para recibir los detalles y soporte de tu orden.
								</p>
							</div>
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
		</>
	);
}
