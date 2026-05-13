'use client';

import { Pagination } from '@heroui/react';
import type { DataTablePaginationProps } from './DataTable.types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTablePagination({
	meta,
	onChange,
	pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
	const { page, limit, total, totalPages } = meta;

	const handlePageChange = (newPage: number) => {
		onChange({ page: newPage, limit });
	};

	const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newLimit = parseInt(e.target.value, 10);
		onChange({ page: 1, limit: newLimit });
	};

	if (totalPages <= 1 && total <= limit) {
		return (
			<div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 text-sm text-gray-500'>
				<span>
					Mostrando {total} {total === 1 ? 'registro' : 'registros'}
				</span>
				<div className='flex items-center gap-2'>
					<span>Mostrar:</span>
					<select
						value={limit}
						onChange={handleLimitChange}
						className='rounded-md border border-gray-200 bg-white px-2 py-1 text-sm'
					>
						{pageSizeOptions.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-stretch gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
			<div className='flex items-center gap-4 text-sm text-gray-500'>
				<span>
					Página {page} de {totalPages}
					<span className='ml-1 text-gray-400'>({total} total)</span>
				</span>
				<div className='flex items-center gap-2'>
					<span>Mostrar:</span>
					<select
						value={limit}
						onChange={handleLimitChange}
						className='rounded-md border border-gray-200 bg-white px-2 py-1 text-sm'
					>
						{pageSizeOptions.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className='flex justify-center sm:justify-end'>
				<Pagination
					total={totalPages}
					page={page}
					onChange={handlePageChange}
					showControls
					color='primary'
					size='sm'
				/>
			</div>
		</div>
	);
}
