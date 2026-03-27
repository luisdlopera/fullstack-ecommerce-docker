'use client';

import { X } from 'lucide-react';

type FormModalProps = {
	open: boolean;
	title: string;
	children: React.ReactNode;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	submitLabel?: string;
	loading?: boolean;
	size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZES = {
	sm: 'max-w-md',
	md: 'max-w-lg',
	lg: 'max-w-2xl',
	xl: 'max-w-4xl',
};

export function FormModal({
	open,
	title,
	children,
	onClose,
	onSubmit,
	submitLabel = 'Guardar',
	loading,
	size = 'md',
}: FormModalProps) {
	if (!open) return null;

	return (
		<div
			className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12'
			onClick={onClose}
		>
			<div
				className={`mx-4 w-full ${SIZES[size]} rounded-xl bg-white shadow-xl`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
					<h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
					<button onClick={onClose} className='rounded-lg p-1 hover:bg-gray-100'>
						<X size={20} className='text-gray-500' />
					</button>
				</div>

				<form onSubmit={onSubmit}>
					<div className='px-6 py-5'>{children}</div>

					<div className='flex justify-end gap-3 border-t border-gray-200 px-6 py-4'>
						<button
							type='button'
							onClick={onClose}
							disabled={loading}
							className='rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
						>
							Cancelar
						</button>
						<button
							type='submit'
							disabled={loading}
							className='rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50'
						>
							{loading ? 'Guardando...' : submitLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
