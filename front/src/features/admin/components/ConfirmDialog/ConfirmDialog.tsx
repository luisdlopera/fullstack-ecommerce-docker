'use client';

import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'danger' | 'warning';
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = 'Confirmar',
	cancelLabel = 'Cancelar',
	variant = 'danger',
	loading,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40' onClick={onCancel}>
			<div
				className='mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='mb-4 flex items-start gap-3'>
					<div className={`rounded-full p-2 ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
						<AlertTriangle
							size={20}
							className={variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
						<p className='mt-1 text-sm text-gray-500'>{description}</p>
					</div>
				</div>
				<div className='flex justify-end gap-3'>
					<button
						onClick={onCancel}
						disabled={loading}
						className='rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
					>
						{cancelLabel}
					</button>
					<button
						onClick={onConfirm}
						disabled={loading}
						className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
							variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
						}`}
					>
						{loading ? 'Procesando...' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
