'use client';

type FilterSelectProps = {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
};

export function FilterSelect({ value, onChange, options, placeholder = 'Filtrar' }: FilterSelectProps) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className='h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition-colors outline-none focus:border-black focus:ring-1 focus:ring-black'
		>
			<option value=''>{placeholder}</option>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}
