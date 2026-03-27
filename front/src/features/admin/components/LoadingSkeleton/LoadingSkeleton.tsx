'use client';

type LoadingSkeletonProps = {
	rows?: number;
	type?: 'table' | 'cards' | 'form';
};

export function LoadingSkeleton({ rows = 5, type = 'table' }: LoadingSkeletonProps) {
	if (type === 'cards') {
		return (
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className='animate-pulse rounded-xl border border-gray-200 bg-white p-6'>
						<div className='mb-2 h-4 w-24 rounded bg-gray-200' />
						<div className='h-8 w-32 rounded bg-gray-200' />
						<div className='mt-2 h-3 w-20 rounded bg-gray-200' />
					</div>
				))}
			</div>
		);
	}

	if (type === 'form') {
		return (
			<div className='animate-pulse space-y-4'>
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i}>
						<div className='mb-1 h-3 w-20 rounded bg-gray-200' />
						<div className='h-10 rounded-lg bg-gray-200' />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className='animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white'>
			<div className='h-12 border-b border-gray-200 bg-gray-50' />
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className='flex gap-4 border-b border-gray-100 px-6 py-4'>
					<div className='h-4 flex-1 rounded bg-gray-200' />
					<div className='h-4 flex-1 rounded bg-gray-200' />
					<div className='h-4 w-20 rounded bg-gray-200' />
				</div>
			))}
		</div>
	);
}
