export type SizeSelectorProps = {
	sizes: string[];
	value: string | null;
	onChange: (size: string) => void;
	disabled?: boolean;
	label?: string;
};
