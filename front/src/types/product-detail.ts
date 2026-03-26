export type ProductColorOption = {
	id: string;
	hex: string;
	label: string;
};

export type SimilarProduct = {
	id: string;
	slug: string;
	name: string;
	/** Precio en unidad mínima (ej. pesos enteros) */
	price: number;
	image: string;
	badge?: string;
	discountLabel?: string;
	isSoldOut?: boolean;
};

export type ProductBenefit = {
	id: string;
	title: string;
	description: string;
	icon: 'truck' | 'return' | 'payment';
};

export type ProductAccordionItem = {
	id: string;
	title: string;
	content: string;
};

export type ProductDetail = {
	id: string;
	reference: string;
	slug: string;
	name: string;
	price: number;
	description: string;
	recommendations: string;
	images: string[];
	sizes: string[];
	colors: ProductColorOption[];
	inStock: number;
	isNew?: boolean;
	benefits: ProductBenefit[];
	similarProducts: SimilarProduct[];
	/** Para cargar relacionados desde el API cuando `similarProducts` viene vacío */
	gender?: string;
	categoryId?: string;
	/** URL o ruta para la guía de tallas (modal o página) */
	sizeGuideHref?: string;
};
