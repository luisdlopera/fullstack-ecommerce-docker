export type QuantitySelectorProps = {
	value: number;
	min?: number;
	max: number;
	onChange: (n: number) => void;
	disabled?: boolean;
};
