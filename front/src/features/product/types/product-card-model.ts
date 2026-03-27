export type ProductCardViewModel = {
	id: string;
	slug: string;
	title: string;
	price: number;
	comparePrice?: number | null;
	image: string;
	image2?: string;
	sizes?: string[];
	isNew: boolean;
	discountPercent: number;
	isSoldOut: boolean;
	/** PDP “similares”: badge superior opcional */
	highlightBadge?: string;
	discountBadge?: string;
};
