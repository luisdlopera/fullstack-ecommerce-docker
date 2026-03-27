import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
	it('submits and invokes onSubmit', () => {
		const onSubmit = vi.fn();
		const onChange = vi.fn();

		render(<SearchBar value='camisa' onChange={onChange} onSubmit={onSubmit} />);

		fireEvent.submit(screen.getByRole('search', { name: 'Búsqueda en catálogo' }));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});
});
