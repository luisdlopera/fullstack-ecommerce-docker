'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductBadge } from './ProductBadge';
import type { CatalogProduct } from './types';

type ProductCardProps = { product: CatalogProduct };

export function ProductCard({ product }: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const href = `/products/${product.slug}`;
  const showSecond = Boolean(product.image2) && hover;

  return (
    <article
      className='group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg'
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={href} className='relative aspect-[4/5] w-full overflow-hidden bg-neutral-100'>
        <div className='absolute left-3 top-3 z-10 flex flex-wrap gap-1.5'>
          {product.isNew && <ProductBadge kind='new' />}
          {product.discountPercent > 0 && <ProductBadge kind='discount' discountPercent={product.discountPercent} />}
          {product.isSoldOut && <ProductBadge kind='soldOut' />}
        </div>
        <Image
          src={showSecond ? (product.image2 as string) : product.image}
          alt={product.name}
          fill
          className='object-cover transition duration-500 ease-out group-hover:scale-[1.03]'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
      </Link>
      <div className='flex flex-col gap-1 px-4 py-4'>
        <Link href={href} className='line-clamp-2 text-base font-semibold text-neutral-900 hover:text-[#343DCB]'>
          {product.name}
        </Link>
        <div className='flex flex-wrap items-baseline gap-2'>
          <span className='text-lg font-bold text-neutral-900'>${product.price.toFixed(2)}</span>
          {product.comparePrice != null && product.comparePrice > product.price && (
            <span className='text-sm text-neutral-400 line-through'>${product.comparePrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </article>
  );
}