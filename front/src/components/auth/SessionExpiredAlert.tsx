'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SessionExpiredAlertProps {
	isOpen: boolean;
	onConfirm: () => void;
}

export function SessionExpiredAlert({ isOpen, onConfirm }: SessionExpiredAlertProps) {
	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => {
			if (!open) onConfirm();
		}} hideCloseButton isDismissable={false} size='md' placement='center'>
			<ModalContent>
				<ModalHeader className='flex flex-col items-center gap-2 pt-6'>
					<div className='rounded-full bg-amber-100 p-3'>
						<Clock className='h-8 w-8 text-amber-600' />
					</div>
					<span className='text-lg font-semibold'>Sesión Expirada</span>
				</ModalHeader>
				<ModalBody className='text-center'>
					<p className='text-gray-600'>
						Tu sesión ha expirado por inactividad. Por seguridad, necesitas iniciar sesión nuevamente.
					</p>
					<div className='mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800'>
						<div className='flex items-center justify-center gap-2'>
							<AlertTriangle className='h-4 w-4' />
							<span>Serás redirigido al login</span>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color='primary' className='w-full' onPress={onConfirm}>
						Ir al Login
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
