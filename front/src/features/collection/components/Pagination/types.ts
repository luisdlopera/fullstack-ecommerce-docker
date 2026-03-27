export type PaginationProps = {
	page: number;
	totalPages: number;
	onPageChange: (p: number) => void;
};
