import type { SidebarDraftFilters } from '../../types';

export type ProductFiltersSidebarProps = {
	draft: SidebarDraftFilters;
	onDraftChange: (next: SidebarDraftFilters) => void;
	categoryNames: string[];
	inStockCount: number;
	outOfStockCount: number;
	onApply: () => void;
};
