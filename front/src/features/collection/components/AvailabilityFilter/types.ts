import type { AvailabilityFilterMode } from '../../types';

export type AvailabilityFilterProps = {
	mode: AvailabilityFilterMode;
	onChange: (m: AvailabilityFilterMode) => void;
	inStockCount: number;
	outOfStockCount: number;
};
