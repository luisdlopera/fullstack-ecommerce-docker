import type { Product } from '@/lib/api';
import type { ProductDetail, ProductBenefit, SimilarProduct } from '@/types/product-detail';

export function mapProductToSimilarProduct(p: Product): SimilarProduct {
	const imgs = p.ProductImage?.map((img) => img.url) ?? [];
	return {
		id: p.id,
		slug: p.slug,
		name: p.title,
		price: p.price,
		image: imgs[0] ?? '/img/shirt/shirt-black-1.png',
		isSoldOut: p.inStock === 0,
	};
}

const defaultBenefits: ProductBenefit[] = [
	{
		id: 'ship',
		title: 'Envíos gratis',
		description: 'En compras seleccionadas. Consulta condiciones.',
		icon: 'truck',
	},
	{
		id: 'returns',
		title: 'Devoluciones gratis',
		description: 'Plazo según política de cambios.',
		icon: 'return',
	},
	{
		id: 'pay',
		title: 'Métodos de pago',
		description: 'Tarjeta y métodos locales disponibles.',
		icon: 'payment',
	},
];

/**
 * Convierte un `Product` del API NEXSTORE al modelo de la vista de detalle.
 * Usa cuando reemplaces los mocks por `fetch` en la página de producto.
 */
export function mapApiProductToProductDetail(product: Product): ProductDetail {
	const images =
		product.ProductImage.length > 0
			? product.ProductImage.map((img) => img.url)
			: ['/img/shirt/shirt-black-1.png'];

	const recommendations =
		'Lava en frío con colores similares. No uses lejía. Sigue las instrucciones de la etiqueta.';

	return {
		id: product.id,
		reference: product.id.slice(0, 8).toUpperCase(),
		slug: product.slug,
		name: product.title,
		price: product.price,
		description: product.description || 'Sin descripción.',
		recommendations,
		images,
		sizes: product.sizes,
		colors: [{ id: 'default', hex: '#1F2937', label: 'Estándar' }],
		inStock: product.inStock,
		isNew: false,
		benefits: defaultBenefits,
		similarProducts: [],
		gender: product.gender,
		categoryId: product.categoryId,
		sizeGuideHref: '#guia-tallas',
	};
}
