'use client';

import { Checkbox } from '@heroui/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useMemo } from 'react';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableEmptyState, DataTableErrorState } from './DataTableEmptyState';
import { DataTableLoading } from './DataTableLoading';
import type { DataTableProps, SortDirection } from './DataTable.types';

export * from './DataTable.types';
export { useDataTable } from './useDataTable';

export function DataTable<T>({
	/* Data */
	columns,
	data,

	/* Selection */
	selectable = false,
	rowKey,
	selectedKeys: controlledSelectedKeys,
	onSelectionChange: controlledOnSelectionChange,

	/* Pagination */
	paginationMeta,
	onPaginationChange,

	/* Sorting */
	sort,
	onSortChange,

	/* Loading & States */
	isLoading,
	isError,
	errorMessage,
	emptyMessage = 'No se encontraron resultados',
	onRetry,

	/* Row interaction */
	onRowClick,

	/* Bulk Actions */
	bulkActions,

	/* Toolbar */
	toolbar,
	showSearch,
	searchPlaceholder,
	onSearch,
	searchValue,

	/* Styling */
	className,
	stickyHeader = false,
}: DataTableProps<T>) {
	const allKeys = useMemo(() => data.map(rowKey), [data, rowKey]);

	const allSelected = useMemo(
		() => selectable && allKeys.length > 0 && allKeys.every((k) => controlledSelectedKeys?.has(k)),
		[selectable, allKeys, controlledSelectedKeys]
	);

	const someSelected = useMemo(
		() => selectable && !allSelected && allKeys.some((k) => controlledSelectedKeys?.has(k)),
		[selectable, allSelected, allKeys, controlledSelectedKeys]
	);

	const handleSelectAll = () => {
		if (!selectable || !controlledSelectedKeys || !controlledOnSelectionChange) return;

		if (allSelected) {
			const next = new Set(controlledSelectedKeys);
			for (const k of allKeys) {
				next.delete(k);
			}
			controlledOnSelectionChange(next);
		} else {
			const next = new Set(controlledSelectedKeys);
			for (const k of allKeys) {
				next.add(k);
			}
			controlledOnSelectionChange(next);
		}
	};

	const handleSelectRow = (key: string) => {
		if (!selectable || !controlledSelectedKeys || !controlledOnSelectionChange) return;
		const next = new Set(controlledSelectedKeys);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		controlledOnSelectionChange(next);
	};

	const handleSort = (columnKey: string, sortable?: boolean) => {
		if (!sortable || !onSortChange) return;

		let direction: SortDirection = 'asc';
		if (sort?.column === columnKey) {
			if (sort.direction === 'asc') direction = 'desc';
			else if (sort.direction === 'desc') direction = null;
		}

		onSortChange({
			column: direction ? columnKey : null,
			direction,
		});
	};

	const selectedCount = controlledSelectedKeys?.size ?? 0;
	const totalCount = paginationMeta?.total ?? data.length;

	const selectedItems = useMemo(
		() => data.filter((row) => controlledSelectedKeys?.has(rowKey(row))),
		[data, controlledSelectedKeys, rowKey]
	);

	/* Render States */

	if (isLoading) {
		return (
			<div className={className}>
				<DataTableLoading columnCount={columns.length + (selectable ? 1 : 0)} />
			</div>
		);
	}

	if (isError) {
		return (
			<div className={className}>
				<DataTableErrorState message={errorMessage ?? 'Error al cargar datos'} onRetry={onRetry} />
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className={className}>
				{toolbar}
				<DataTableEmptyState message={emptyMessage} />
			</div>
		);
	}

	return (
		<div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className ?? ''}`}>
			{/* Toolbar */}
			{(selectable || toolbar) && (
				<DataTableToolbar<T>
					selectedCount={selectedCount}
					totalCount={totalCount}
					bulkActions={bulkActions}
					selectedItems={selectedItems}
					selectedKeys={Array.from(controlledSelectedKeys ?? [])}
					onClearSelection={() => controlledOnSelectionChange?.(new Set())}
					searchComponent={
						showSearch ? (
							<input
								type='text'
								placeholder={searchPlaceholder}
								value={searchValue}
								onChange={(e) => onSearch?.(e.target.value)}
								className='w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none'
							/>
						) : undefined
					}
					filtersComponent={toolbar}
				/>
			)}

			{/* Table */}
			<div className='overflow-x-auto'>
				<table className='w-full'>
					<thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
						<tr className='border-y border-gray-200 bg-gray-50'>
							{selectable && (
								<th className='w-12 px-4 py-3'>
									<Checkbox
										size='sm'
										isSelected={allSelected}
										isIndeterminate={someSelected}
										onValueChange={handleSelectAll}
										aria-label='Seleccionar todos'
									/>
								</th>
							)}
							{columns.map((col) => {
								const isSorted = sort?.column === col.key;
								const canSort = col.sortable && onSortChange;

								return (
									<th
										key={col.key}
										className={`px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase ${col.className ?? ''} ${canSort ? 'cursor-pointer hover:text-gray-700' : ''}`}
										onClick={() => handleSort(col.key, col.sortable)}
									>
										<div className='flex items-center gap-1'>
											{col.header}
											{canSort && isSorted && (
												<span className='text-primary-600'>
													{sort.direction === 'asc' ? (
														<ChevronUp size={14} />
													) : sort.direction === 'desc' ? (
														<ChevronDown size={14} />
													) : null}
												</span>
											)}
										</div>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-100'>
						{data.map((row) => {
							const key = rowKey(row);
							const isRowSelected = selectable && controlledSelectedKeys?.has(key);

							return (
								<tr
									key={key}
									onClick={() => onRowClick?.(row)}
									className={`transition-colors ${
										isRowSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
									} ${onRowClick ? 'cursor-pointer' : ''}`}
								>
									{selectable && (
										<td className='w-12 px-4 py-4' onClick={(e) => e.stopPropagation()}>
											<Checkbox
												size='sm'
												isSelected={isRowSelected}
												onValueChange={() => handleSelectRow(key)}
												aria-label={`Seleccionar fila ${key}`}
											/>
										</td>
									)}
									{columns.map((col) => (
										<td
											key={col.key}
											className={`px-6 py-4 text-sm text-gray-700 ${col.className ?? ''}`}
										>
											{col.render(row)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{paginationMeta && onPaginationChange && (
				<DataTablePagination meta={paginationMeta} onChange={onPaginationChange} />
			)}
		</div>
	);
}

export type {
	Column,
	BulkAction,
	DataTableProps,
	SortState,
	PaginationState,
	FilterState,
	PaginationMeta,
} from './DataTable.types';
