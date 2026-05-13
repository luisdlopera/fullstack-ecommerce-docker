import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export type SortState = {
	column: string | null;
	direction: SortDirection;
};

export type PaginationState = {
	page: number;
	limit: number;
};

export type PaginationMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type FilterState = Record<string, string | boolean | undefined>;

export type Column<T = unknown> = {
	key: string;
	header: string;
	render: (row: T) => ReactNode;
	className?: string;
	width?: string;
	sortable?: boolean;
	hidden?: boolean;
};

export type BulkAction<T = unknown> = {
	key: string;
	label: string;
	icon?: ReactNode;
	variant?: 'solid' | 'flat' | 'ghost';
	color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
	onAction: (selectedItems: T[], selectedKeys: string[]) => void | Promise<void>;
	isDisabled?: (selectedItems: T[], selectedKeys: string[]) => boolean;
	isLoading?: boolean;
};

export type DataTableProps<T = unknown> = {
	/* Data */
	columns: Column<T>[];
	data: T[];

	/* Selection */
	selectable?: boolean;
	rowKey: (row: T) => string;
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;

	/* Pagination */
	pagination?: PaginationState;
	paginationMeta?: PaginationMeta;
	onPaginationChange?: (pagination: PaginationState) => void;

	/* Sorting */
	sort?: SortState;
	onSortChange?: (sort: SortState) => void;

	/* Loading & States */
	isLoading?: boolean;
	isError?: boolean;
	errorMessage?: string;
	emptyMessage?: string;
	onRetry?: () => void;

	/* Row interaction */
	onRowClick?: (row: T) => void;

	/* Bulk Actions */
	bulkActions?: BulkAction<T>[];

	/* Toolbar */
	toolbar?: ReactNode;
	showSearch?: boolean;
	searchPlaceholder?: string;
	onSearch?: (query: string) => void;
	searchValue?: string;

	/* Styling */
	className?: string;
	stickyHeader?: boolean;
};

export type DataTableToolbarProps<T = unknown> = {
	selectedCount: number;
	totalCount: number;
	bulkActions?: BulkAction<T>[];
	selectedItems: T[];
	selectedKeys: string[];
	onClearSelection: () => void;
	searchComponent?: ReactNode;
	filtersComponent?: ReactNode;
};

export type DataTablePaginationProps = {
	meta: PaginationMeta;
	onChange: (pagination: PaginationState) => void;
	pageSizeOptions?: number[];
};

export type DataTableEmptyStateProps = {
	message: string;
	icon?: ReactNode;
	action?: ReactNode;
};

export type DataTableLoadingProps = {
	columnCount: number;
	rowCount?: number;
};
