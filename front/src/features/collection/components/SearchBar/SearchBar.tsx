'use client';

import { Search } from 'lucide-react';
import type { SearchBarProps } from './types';

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
	return (
		<form
			role='search'
			aria-label='Búsqueda en catálogo'
			className='flex w-full flex-col gap-2 sm:flex-row sm:items-center'
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			<div className='relative flex-1'>
				<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400' />
				<input
					type='search'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder='Buscar por nombre...'
					aria-label='Buscar por nombre de producto'
					className='h-11 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-sm text-neutral-900 ring-[#343DCB]/30 transition outline-none placeholder:text-neutral-400 focus:border-[#343DCB] focus:ring-2'
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
