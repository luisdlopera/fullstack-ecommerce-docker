export function CatalogListingSkeleton() {
	return (
		<div
			className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
			aria-busy='true'
			aria-label='Cargando productos'
		>
			{Array.from({ length: 9 }, (_, i) => (
				<div
					key={i}
					className='flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm'
				>
					<div className='aspect-[4/5] w-full animate-pulse bg-neutral-200' />
					<div className='flex flex-col gap-2 px-4 py-4'>
						<div className='h-4 w-3/4 animate-pulse rounded bg-neutral-200' />
						<div className='h-4 w-1/2 animate-pulse rounded bg-neutral-200' />
					</div>
				</div>
			))}
		</div>
	);
}
