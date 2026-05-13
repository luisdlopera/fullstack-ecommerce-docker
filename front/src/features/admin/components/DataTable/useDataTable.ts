'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortState, PaginationState, FilterState } from './DataTable.types';

type UseDataTableReturn<T> = {
	/* Selection */
	selectedKeys: Set<string>;
	selectedItems: T[];
	handleSelectionChange: (keys: Set<string>) => void;
	handleSelectAll: () => void;
	clearSelection: () => void;
	allSelected: boolean;
	someSelected: boolean;

	/* Pagination */
	pagination: PaginationState;
	handlePageChange: (page: number) => void;
	handleLimitChange: (limit: number) => void;

	/* Sorting */
	sort: SortState;
	handleSort: (column: string) => void;

	/* Filters */
	filters: FilterState;
	handleFilterChange: (key: string, value: string | boolean | undefined) => void;
	clearFilters: () => void;
};

type UseDataTableOptions = {
	initialPagination?: Partial<PaginationState>;
	initialSort?: SortState;
	initialFilters?: FilterState;
};

export function useDataTable<T>(
	data: T[],
	rowKey: (row: T) => string,
	options: UseDataTableOptions = {}
): UseDataTableReturn<T> {
	const { initialPagination = {}, initialSort = { column: null, direction: null }, initialFilters = {} } = options;

	/* Selection State */
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

	/* Pagination State */
	const [pagination, setPagination] = useState<PaginationState>({
		page: 1,
		limit: 20,
		...initialPagination,
	});

	/* Sort State */
	const [sort, setSort] = useState<SortState>(initialSort);

	/* Filter State */
	const [filters, setFilters] = useState<FilterState>(initialFilters);

	/* Derived Selection Values */
	const allKeys = useMemo(() => data.map(rowKey), [data, rowKey]);

	const allSelected = useMemo(
		() => allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k)),
		[allKeys, selectedKeys]
	);

	const someSelected = useMemo(
		() => !allSelected && allKeys.some((k) => selectedKeys.has(k)),
		[allSelected, allKeys, selectedKeys]
	);

	const selectedItems = useMemo(
		() => data.filter((row) => selectedKeys.has(rowKey(row))),
		[data, selectedKeys, rowKey]
	);

	/* Selection Handlers */
	const handleSelectionChange = useCallback((keys: Set<string>) => {
		setSelectedKeys(keys);
	}, []);

	const handleSelectAll = useCallback(() => {
		if (allSelected) {
			// Deselect all visible
			const next = new Set(selectedKeys);
			for (const k of allKeys) {
				next.delete(k);
			}
			setSelectedKeys(next);
		} else {
			// Select all visible
			const next = new Set(selectedKeys);
			for (const k of allKeys) {
				next.add(k);
			}
			setSelectedKeys(next);
		}
	}, [allKeys, allSelected, selectedKeys]);

	const clearSelection = useCallback(() => {
		setSelectedKeys(new Set());
	}, []);

	/* Pagination Handlers */
	const handlePageChange = useCallback((page: number) => {
		setPagination((prev) => ({ ...prev, page }));
	}, []);

	const handleLimitChange = useCallback((limit: number) => {
		setPagination((prev) => ({ ...prev, page: 1, limit }));
	}, []);

	/* Sort Handlers */
	const handleSort = useCallback((column: string) => {
		setSort((prev) => {
			if (prev.column !== column) {
				return { column, direction: 'asc' };
			}
			if (prev.direction === 'asc') {
				return { column, direction: 'desc' };
			}
			return { column: null, direction: null };
		});
	}, []);

	/* Filter Handlers */
	const handleFilterChange = useCallback((key: string, value: string | boolean | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setPagination((prev) => ({ ...prev, page: 1 }));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters({});
		setPagination((prev) => ({ ...prev, page: 1 }));
	}, []);

	return {
		selectedKeys,
		selectedItems,
		handleSelectionChange,
		handleSelectAll,
		clearSelection,
		allSelected,
		someSelected,
		pagination,
		handlePageChange,
		handleLimitChange,
		sort,
		handleSort,
		filters,
		handleFilterChange,
		clearFilters,
	};
}
