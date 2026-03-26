'use client';

import { Search } from 'lucide-react';

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      className='flex w-full flex-col gap-2 sm:flex-row sm:items-center'
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className='relative flex-1'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400' />
        <input
          type='search'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Buscar por nombre...'
          className='h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 outline-none ring-[#343DCB]/30 transition placeholder:text-neutral-400 focus:border-[#343DCB] focus:ring-2'
        />
      </div>
      <button
        type='submit'
        className='h-11 shrink-0 rounded-xl bg-[#343DCB] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f37b7]'
      >
        Buscar
      </button>
    </form>
  );
}