export type ProductGalleryProps = {
	images: string[];
	selectedIndex: number;
	onSelectIndex: (index: number) => void;
	productName: string;
	isNew?: boolean;
	isFavorite?: boolean;
	onToggleFavorite?: () => void;
	className?: string;
};
