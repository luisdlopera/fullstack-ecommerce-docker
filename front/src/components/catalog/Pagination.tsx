'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className='mt-10 flex flex-wrap items-center justify-center gap-2' aria-label='Paginación'>
      <button
        type='button'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40'
        aria-label='Anterior'
      >
        <ChevronLeft className='h-5 w-5' />
      </button>
      {pages.map((n) => (
        <button
          key={n}
          type='button'
          onClick={() => onPageChange(n)}
          className={
            n === page
              ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#343DCB] px-3 text-sm font-semibold text-white shadow-sm'
              : 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50'
          }
        >
          {n}
        </button>
      ))}
      <button
        type='button'
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40'
        aria-label='Siguiente'
      >
        <ChevronRight className='h-5 w-5' />
      </button>
    </nav>
  );
}