export function ProductDetailSkeleton() {
	return (
		<div className='min-h-screen bg-neutral-50 text-neutral-900' aria-busy='true' aria-label='Cargando producto'>
			<main className='mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-8 lg:px-10'>
				<section className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]'>
					<div className='aspect-[4/5] w-full animate-pulse rounded-2xl bg-neutral-200 lg:aspect-auto lg:h-[640px]' />
					<div className='flex flex-col gap-4'>
						<div className='h-8 w-2/3 animate-pulse rounded-lg bg-neutral-200' />
						<div className='h-10 w-1/3 animate-pulse rounded-lg bg-neutral-200' />
						<div className='h-24 w-full animate-pulse rounded-lg bg-neutral-200' />
						<div className='h-12 w-full animate-pulse rounded-xl bg-neutral-200' />
						<div className='h-12 w-full animate-pulse rounded-xl bg-neutral-200' />
					</div>
				</section>
			</main>
		</div>
	);
}
