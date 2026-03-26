import type { Product } from '@/lib/api';
import { discountPercent, isNewFromTags } from '@/lib/product-flags';
import type { CatalogProduct, CollectionSlug } from './types';

function tagValues(prefix: string, tags: string[]): string[] {
  const p = `${prefix}:`;
  return tags.filter((t) => t.startsWith(p)).map((t) => t.slice(p.length));
}

export function mapProductToCatalog(p: Product, collection: CollectionSlug): CatalogProduct {
  const tags = (p.tags ?? []).map((t) => t.toLowerCase());
  const isNew = isNewFromTags(p.tags ?? []);
  const isSoldOut = p.inStock <= 0;
  const compare = p.comparePrice ?? null;
  const imgs = p.ProductImage ?? [];
  const image = imgs[0]?.url ?? '/img/shirt/shirt-black-1.png';
  const image2 = imgs[1]?.url;

  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    price: p.price,
    comparePrice: compare,
    image,
    image2,
    isNew,
    isSoldOut,
    discountPercent: discountPercent(p.price, compare),
    categoryName: p.category?.name ?? '',
    collection,
    sizes: p.sizes ?? [],
    colors: tagValues('c', tags),
    collections: tagValues('col', tags),
    classification: tagValues('class', tags),
    tags,
  };
}