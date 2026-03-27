import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useCatalogUrlState } from './useCatalogUrlState';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ replace }),
	usePathname: () => '/men',
	useSearchParams: () => searchParams,
}));

describe('useCatalogUrlState', () => {
	beforeEach(() => {
		replace.mockClear();
		searchParams = new URLSearchParams('page=2&q=foo&size=M');
	});

	it('reads page, search and filters from searchParams', () => {
		const { result } = renderHook(() => useCatalogUrlState());
		expect(result.current.page).toBe(2);
		expect(result.current.searchQuery).toBe('foo');
		expect(result.current.filtersFromUrl.sizes).toEqual(['M']);
	});

	it('replaceCatalogQuery updates URL via router.replace', () => {
		const { result } = renderHook(() => useCatalogUrlState());
		act(() => {
			result.current.replaceCatalogQuery({ page: 1, q: 'bar', filters: result.current.filtersFromUrl });
		});
		expect(replace).toHaveBeenCalledWith(expect.stringContaining('/men?'), { scroll: false });
		const called = replace.mock.calls[0][0] as string;
		expect(called).not.toContain('page=');
		expect(called).toContain('q=bar');
		expect(called).toContain('size=M');
	});
});
