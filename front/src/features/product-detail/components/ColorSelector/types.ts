import type { ProductColorOption } from '../../types';

export type ColorSelectorProps = {
	colors: ProductColorOption[];
	value: string | null;
	onChange: (colorId: string) => void;
	disabled?: boolean;
	label?: string;
};
