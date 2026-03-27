'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

type ErrorStateProps = {
	message?: string;
	onRetry?: () => void;
};

export function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }: ErrorStateProps) {
	return (
		<div className='flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12'>
			<AlertCircle size={32} className='mb-3 text-red-500' />
			<p className='text-sm font-medium text-red-700'>{message}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className='mt-4 flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-100'
				>
					<RefreshCw size={14} />
					Reintentar
				</button>
			)}
		</div>
	);
}
