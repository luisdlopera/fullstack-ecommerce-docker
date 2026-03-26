import type { CatalogProduct } from './types';
import { ProductCard } from './ProductCard';

type ProductGridProps = { products: CatalogProduct[] };

export function ProductGrid({ products }: ProductGridProps) {
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
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}