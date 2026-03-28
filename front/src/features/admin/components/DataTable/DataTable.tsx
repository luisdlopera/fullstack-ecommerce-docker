'use client';

import { Pagination } from '@heroui/react';

export type Column<T> = {
	key: string;
	header: string;
	render: (row: T) => React.ReactNode;
	className?: string;
};

type DataTableProps<T> = {
	columns: Column<T>[];
	data: T[];
	page?: number;
	totalPages?: number;
	total?: number;
	onPageChange?: (page: number) => void;
	isLoading?: boolean;
	emptyMessage?: string;
	onRowClick?: (row: T) => void;
};

export function DataTable<T>({
	columns,
	data,
	page = 1,
	totalPages = 1,
	total,
	onPageChange,
	isLoading,
	emptyMessage = 'No se encontraron resultados',
	onRowClick,
}: DataTableProps<T>) {
	if (isLoading) {
		return (
			<div className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
				<div className='animate-pulse'>
					<div className='h-12 border-b border-gray-200 bg-gray-50' />
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='flex gap-4 border-b border-gray-100 px-6 py-4'>
							{columns.map((col) => (
								<div key={col.key} className='h-4 flex-1 rounded bg-gray-200' />
							))}
						</div>
					))}
				</div>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16'>
				<div className='mb-3 rounded-full bg-gray-100 p-3'>
					<svg
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						className='text-gray-400'
					>
						<path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
					</svg>
				</div>
				<p className='text-sm text-gray-500'>{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
			<div className='overflow-x-auto'>
				<table className='w-full'>
					<thead>
						<tr className='border-b border-gray-200 bg-gray-50'>
							{columns.map((col) => (
								<th
									key={col.key}
									className={`px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase ${col.className ?? ''}`}
								>
									{col.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-100'>
						{data.map((row, i) => (
							<tr
								key={i}
								onClick={() => onRowClick?.(row)}
								className={`transition-colors hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
							>
								{columns.map((col) => (
									<td
										key={col.key}
										className={`px-6 py-4 text-sm text-gray-700 ${col.className ?? ''}`}
									>
										{col.render(row)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{onPageChange && totalPages > 1 && (
				<div className='flex flex-col items-stretch gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-sm text-gray-500'>
						Página {page} de {totalPages}
						{total !== undefined && <span className='ml-1'>({total} resultados)</span>}
					</p>
					<div className='flex justify-center sm:justify-end'>
						<Pagination
							total={totalPages}
							page={page}
							onChange={onPageChange}
							showControls
							color='primary'
							size='sm'
						/>
					</div>
				</div>
			)}
		</div>
	);
}
