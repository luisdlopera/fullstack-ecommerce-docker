import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
	it('calls onPageChange when a page number is pressed', () => {
		const onPageChange = vi.fn();
		render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

		fireEvent.click(screen.getByRole('button', { name: 'Ir a página 3' }));
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	it('marks current page', () => {
		render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
		expect(screen.getByRole('button', { name: 'Ir a página 2' })).toHaveAttribute('aria-current', 'page');
	});
});
