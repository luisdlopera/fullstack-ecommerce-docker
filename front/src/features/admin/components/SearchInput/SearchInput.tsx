'use client';

import { Input } from '@heroui/react';
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
		<Input
			type='text'
			defaultValue={value}
			onChange={handleChange}
			placeholder={placeholder}
			variant='flat'
			size='sm'
			radius='lg'
			startContent={<Search size={16} className='text-gray-400' />}
			className='w-full sm:w-72'
		/>
	);
}
