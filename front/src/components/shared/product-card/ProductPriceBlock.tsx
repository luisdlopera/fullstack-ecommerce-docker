import { formatCOP } from '@/lib/format-currency';

type ProductPriceBlockProps = {
	price: number;
	comparePrice?: number | null;
	/** Catálogo (neutral) vs tienda home/search (centrado). */
	variant?: 'catalog' | 'shop';
};

export function ProductPriceBlock({ price, comparePrice, variant = 'catalog' }: ProductPriceBlockProps) {
	const showCompare = comparePrice != null && comparePrice > price;

	if (variant === 'shop') {
		return (
			<div className='text-center'>
				<p className='text-black'>{formatCOP(price)}</p>
				{showCompare && <p className='text-sm text-neutral-400 line-through'>{formatCOP(comparePrice)}</p>}
			</div>
		);
	}

	return (
		<div className='flex flex-wrap items-baseline gap-2'>
			<span className='text-lg font-bold text-neutral-900'>{formatCOP(price)}</span>
			{showCompare && <span className='text-sm text-neutral-400 line-through'>{formatCOP(comparePrice)}</span>}
		</div>
	);
}
