import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('React Testing Library', () => {
	it('is wired for component tests', () => {
		render(<span data-testid='rtl-smoke'>ok</span>);
		expect(screen.getByTestId('rtl-smoke')).toHaveTextContent('ok');
	});
});
