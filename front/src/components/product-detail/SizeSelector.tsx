'use client';

type SizeSelectorProps = {
	sizes: string[];
	value: string | null;
	onChange: (size: string) => void;
	disabled?: boolean;
	label?: string;
};

export function SizeSelector({
	sizes,
	value,
	onChange,
	disabled,
	label = 'Selecciona una talla',
}: SizeSelectorProps) {
	return (
		<div>
			<p className='mb-2 text-xs font-medium text-neutral-600 md:text-sm'>{label}</p>
			<div className='flex flex-wrap gap-1.5'>
				{sizes.map((size) => {
					const selected = value === size;
					return (
						<button
							key={size}
							type='button'
							disabled={disabled}
							onClick={() => onChange(size)}
							className={`rounded-lg border px-3 py-2 text-xs font-medium transition md:rounded-xl md:px-4 md:text-sm ${
								selected
									? 'border-neutral-900 bg-neutral-900 text-white'
									: 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
							} disabled:cursor-not-allowed disabled:opacity-40`}
						>
							{size}
						</button>
					);
				})}
			</div>
		</div>
	);
}
