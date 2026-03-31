'use client';

import { Input } from '@heroui/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

type SearchInputProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
	const [localValue, setLocalValue] = useState(value);

	// Sync local value with prop if prop changes externally (e.g. from parent reset)
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Debounce local value changes to parent onChange
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localValue !== value) {
				onChange(localValue);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [localValue, onChange, value]);

	return (
		<Input
			type='text'
			value={localValue}
			onValueChange={setLocalValue}
			placeholder={placeholder}
			variant='flat'
			size='sm'
			radius='lg'
			startContent={<Search size={16} className='text-gray-400' />}
			className='w-full sm:w-72'
		/>
	);
}
