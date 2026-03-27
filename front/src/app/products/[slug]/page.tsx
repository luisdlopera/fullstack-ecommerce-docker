import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailPageClient } from '@/features/product-detail/ProductDetailPageClient';
import { getProductBySlugOrNull } from '@/lib/api';
import { isProductDetailMockEnabled } from '@/lib/product-detail-mock';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	if (isProductDetailMockEnabled()) {
		return { title: 'Producto' };
	}
	const product = await getProductBySlugOrNull(slug);
	if (!product) {
		return { title: 'Producto no encontrado' };
	}
	return { title: product.title };
}

export default async function ProductDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const useMock = isProductDetailMockEnabled();

	let initialApiProduct = null as Awaited<ReturnType<typeof getProductBySlugOrNull>>;
	if (!useMock) {
		initialApiProduct = await getProductBySlugOrNull(slug);
		if (!initialApiProduct) {
			notFound();
		}
	}

	return <ProductDetailPageClient key={slug} slug={slug} initialApiProduct={initialApiProduct} useMock={useMock} />;
}
