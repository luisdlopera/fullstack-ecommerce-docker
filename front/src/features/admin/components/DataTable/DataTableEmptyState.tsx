'use client';

import { Search, FileX } from 'lucide-react';
import type { DataTableEmptyStateProps } from './DataTable.types';

export function DataTableEmptyState({ message, icon, action }: DataTableEmptyStateProps) {
	return (
		<div className='flex flex-col items-center justify-center rounded-b-xl border-x border-b border-gray-200 bg-white py-16'>
			<div className='mb-4 rounded-full bg-gray-100 p-4'>
				{icon ?? (
					<Search
						size={32}
						className='text-gray-400'
						strokeWidth={1.5}
					/>
				)}
			</div>
			<p className='mb-2 text-sm font-medium text-gray-900'>{message}</p>
			<p className='mb-4 text-xs text-gray-500'>
				Intenta ajustar los filtros o realizar una nueva búsqueda
			</p>
			{action && <div className='mt-2'>{action}</div>}
		</div>
	);
}

export function DataTableErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	return (
		<div className='flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16'>
			<div className='mb-4 rounded-full bg-red-50 p-4'>
				<FileX size={32} className='text-red-500' strokeWidth={1.5} />
			</div>
			<p className='mb-2 text-sm font-medium text-gray-900'>Error al cargar datos</p>
			<p className='mb-4 max-w-md text-center text-xs text-gray-500'>{message}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className='rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700'
				>
					Reintentar
				</button>
			)}
		</div>
	);
}
