import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCollectionSlug, ProductListingPage } from '@/components/catalog';

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
  return <ProductListingPage collection={collection} />;
}