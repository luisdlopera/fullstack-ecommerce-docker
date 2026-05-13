'use client';

import type { DataTableLoadingProps } from './DataTable.types';

export function DataTableLoading({ columnCount, rowCount = 5 }: DataTableLoadingProps) {
	return (
		<div className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
			<div className='animate-pulse'>
				{/* Header */}
				<div className='flex h-12 items-center border-b border-gray-200 bg-gray-50 px-4'>
					<div className='mr-4 h-4 w-4 rounded bg-gray-200' />
					{Array.from({ length: columnCount }).map((_, i) => (
						<div
							key={i}
							className='mr-6 h-4 flex-1 rounded bg-gray-200'
							style={{ maxWidth: i === 0 ? '200px' : '120px' }}
						/>
					))}
				</div>

				{/* Rows */}
				{Array.from({ length: rowCount }).map((_, rowIndex) => (
					<div
						key={rowIndex}
						className='flex items-center border-b border-gray-100 px-4 py-4'
					>
						<div className='mr-4 h-4 w-4 rounded bg-gray-200' />
						{Array.from({ length: columnCount }).map((_, colIndex) => (
							<div
								key={colIndex}
								className='mr-6 h-4 flex-1 rounded bg-gray-200'
								style={{
									maxWidth: colIndex === 0 ? '200px' : colIndex === columnCount - 1 ? '100px' : '120px',
									width: '100%',
								}}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
