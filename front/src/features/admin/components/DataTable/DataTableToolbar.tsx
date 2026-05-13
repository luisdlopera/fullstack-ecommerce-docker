'use client';

import { Button, Chip } from '@heroui/react';
import { X } from 'lucide-react';
import type { DataTableToolbarProps } from './DataTable.types';

export function DataTableToolbar<T>({
	selectedCount,
	totalCount,
	bulkActions,
	selectedItems,
	selectedKeys,
	onClearSelection,
	searchComponent,
	filtersComponent,
}: DataTableToolbarProps<T>) {
	const hasSelection = selectedCount > 0;

	return (
		<div className='flex flex-col gap-3 rounded-t-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between'>
			{/* Left: Search & Filters */}
			<div className='flex flex-1 flex-wrap items-center gap-3'>
				{searchComponent && <div className='flex-shrink-0'>{searchComponent}</div>}
				{filtersComponent && <div className='flex flex-wrap gap-2'>{filtersComponent}</div>}
			</div>

			{/* Right: Selection Info & Bulk Actions */}
			<div className='flex items-center gap-3'>
				{hasSelection ? (
					<div className='flex items-center gap-3'>
						<Chip
							variant='flat'
							color='primary'
							size='sm'
							classNames={{
								base: 'bg-primary-50 text-primary-700',
							}}
						>
							{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''} de {totalCount}
						</Chip>

						{bulkActions?.map((action) => {
							const disabled = action.isDisabled?.(selectedItems, selectedKeys) ?? false;
							return (
								<Button
									key={action.key}
									size='sm'
									variant={action.variant ?? 'flat'}
									color={action.color ?? 'primary'}
									isDisabled={disabled || action.isLoading}
									isLoading={action.isLoading}
									onPress={() => action.onAction(selectedItems, selectedKeys)}
									startContent={!action.isLoading && action.icon}
									className={
										action.color === 'danger' ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''
									}
								>
									{action.label}
								</Button>
							);
							})}

						<Button
							size='sm'
							variant='ghost'
							onPress={onClearSelection}
							startContent={<X size={14} />}
						>
							Limpiar
						</Button>
					</div>
				) : (
					<span className='text-sm text-gray-500'>
						{totalCount} {totalCount === 1 ? 'registro' : 'registros'}
					</span>
				)}
			</div>
		</div>
	);
}
