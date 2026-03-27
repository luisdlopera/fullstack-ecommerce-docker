import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogListingSkeleton, isCollectionSlug, ProductListingPage } from '@/features/collection';

type PageProps = { params: Promise<{ collection: string }> };

const TITLES: Record<string, string> = {
	men: 'Men Collection | NEXSTORE',
	women: 'Woman Collection | NEXSTORE',
	kids: 'Kids Collection | NEXSTORE',
	new: 'Nueva colección | NEXSTORE',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { collection } = await params;
	if (!isCollectionSlug(collection)) return { title: 'NEXSTORE' };
	return { title: TITLES[collection] ?? 'NEXSTORE' };
}

export default async function CollectionPage({ params }: PageProps) {
	const { collection } = await params;
	if (!isCollectionSlug(collection)) notFound();
	return (
		<Suspense
			fallback={
				<div className='mx-auto w-full max-w-7xl px-4 pt-28 pb-16 md:px-6 lg:px-8'>
					<CatalogListingSkeleton />
				</div>
			}
		>
			<ProductListingPage collection={collection} />
		</Suspense>
	);
}
