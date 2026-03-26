import type { ProductBadgeKind } from './types';

type ProductBadgeProps = {
  kind: ProductBadgeKind;
  discountPercent?: number;
};

export function ProductBadge({ kind, discountPercent = 0 }: ProductBadgeProps) {
  if (kind === 'new') {
    return (
      <span className='rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'>
        Nuevo
      </span>
    );
  }
  if (kind === 'soldOut') {
    return (
      <span className='rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'>
        Agotado
      </span>
    );
  }
  if (kind === 'discount' && discountPercent > 0) {
    return (
      <span className='rounded-md bg-[#343DCB] px-2 py-0.5 text-[10px] font-semibold text-white'>
        {discountPercent}%
      </span>
    );
  }
  return null;
}