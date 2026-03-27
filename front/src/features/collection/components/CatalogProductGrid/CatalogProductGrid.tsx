import { CatalogProductCard } from '../CatalogProductCard';
import type { CatalogProductGridProps } from './types';

export function CatalogProductGrid({ products }: CatalogProductGridProps) {
	if (products.length === 0) {
		return (
			<div className='rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-20 text-center text-neutral-500'>
				No hay productos con los filtros seleccionados.
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
			{products.map((p) => (
				<CatalogProductCard key={p.id} product={p} />
			))}
		</div>
	);
}
