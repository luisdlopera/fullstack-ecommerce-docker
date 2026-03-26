'use client';

import { Search } from 'lucide-react';
import { useRef } from 'react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(newValue), 300);
  };

  return (
    <div className='relative'>
      <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
      <input
        type='text'
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className='h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black sm:w-72'
      />
    </div>
  );
}
