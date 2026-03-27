import type { ProductDetail } from '../../types';

export type ProductInfoProps = {
	product: ProductDetail;
	selectedSize: string | null;
	onSizeChange: (size: string) => void;
	selectedColorId: string | null;
	onColorChange: (colorId: string) => void;
	quantity: number;
	onQuantityChange: (n: number) => void;
	onAddToCart: () => void;
	onBuyNow: () => void;
	onToggleFavorite: () => void;
	isFavorite: boolean;
	addToCartLabel?: string;
	disabledAdd?: boolean;
	disabledBuy?: boolean;
	outOfStock?: boolean;
	className?: string;
};
