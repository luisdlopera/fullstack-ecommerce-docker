import type { ProductDetail } from '@/features/product-detail';

const thumbs = [
	'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
	'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
	'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
	'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=80',
];

/**
 * Producto principal mock: camiseta negra básica.
 * Sustituir por `fetch` al API cuando conectes el backend.
 */
export const mockBlackTeeDetail: ProductDetail = {
	id: 'mock-black-tee-01',
	reference: '454654',
	slug: 'camiseta-basica-negra',
	name: 'Camiseta básica negra',
	price: 85000,
	description:
		'Prenda básica premium de ajuste relajado, jersey de algodón peinado con tacto suave y excelente caída. Cuello redondo reforzado, costuras laterales y bajo limpio. Ideal para looks casuales, capas en temporada y combinaciones minimalistas. Fabricada con procesos que reducen el desperdicio de agua en el acabado.',
	recommendations:
		'Lava en frío con colores similares. No uses lejía. Seca a la sombra para mantener el negro intenso. Plancha a temperatura media por el revés. Modelo con caída relaxed: si buscas ajuste más ceñido, considera una talla menos.',
	images: thumbs,
	sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
	colors: [
		{ id: 'teal', hex: '#115E59', label: 'Verde pino' },
		{ id: 'black', hex: '#1F2937', label: 'Negro' },
		{ id: 'sand', hex: '#D4A373', label: 'Arena' },
	],
	inStock: 24,
	isNew: true,
	gender: 'men',
	sizeGuideHref: '#guia-tallas',
	benefits: [
		{
			id: 'ship',
			title: 'Envíos gratis',
			description: 'En compras seleccionadas. Aplica políticas de la tienda.',
			icon: 'truck',
		},
		{
			id: 'returns',
			title: 'Devoluciones gratis',
			description: 'Plazo y condiciones según política de cambios NEXSTORE.',
			icon: 'return',
		},
		{
			id: 'pay',
			title: 'Métodos de pago',
			description: 'Tarjeta crédito, débito y opciones locales disponibles.',
			icon: 'payment',
		},
	],
	similarProducts: [
		{
			id: 'sim-1',
			slug: 'buzo-pullover-verde',
			name: 'Buzo pullover verde',
			price: 139000,
			image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
			badge: 'Agotado',
			isSoldOut: true,
		},
		{
			id: 'sim-2',
			slug: 'vestido-azul-texto',
			name: 'Vestido azul texto',
			price: 89000,
			image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
			badge: 'Nuevo',
			discountLabel: '30%',
		},
		{
			id: 'sim-3',
			slug: 'camisa-lino-natural',
			name: 'Camisa lino natural',
			price: 112000,
			image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
			badge: 'Nuevo',
			discountLabel: '30%',
		},
		{
			id: 'sim-4',
			slug: 'top-minimal-arena',
			name: 'Top minimal arena',
			price: 69000,
			image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
			badge: 'Nuevo',
			discountLabel: '30%',
		},
	],
};

/** Devuelve el mock de detalle; más adelante: buscar por slug desde API. */
export function getMockProductDetail(slug: string): ProductDetail {
	void slug;
	return mockBlackTeeDetail;
}
