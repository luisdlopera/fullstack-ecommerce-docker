import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailPageClient } from '@/features/product-detail/ProductDetailPageClient';
import { getProductBySlugOrNull } from '@/lib/api';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const product = await getProductBySlugOrNull(slug);
	if (!product) {
		return { title: 'Producto no encontrado' };
	}
	return { title: product.title };
}

export default async function ProductDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const initialApiProduct = await getProductBySlugOrNull(slug);

	if (!initialApiProduct) {
		notFound();
	}

	return <ProductDetailPageClient key={slug} slug={slug} initialApiProduct={initialApiProduct} />;
}
