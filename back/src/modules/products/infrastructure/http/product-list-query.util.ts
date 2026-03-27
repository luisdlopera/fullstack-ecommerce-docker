import type { ProductListFilters } from '../../domain/ports/product-repository.port';

export type ProductListQueryParams = {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  tag?: string;
  mustTag?: string;
  anyTags?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sizes?: string;
  colors?: string;
  categories?: string;
  colSlugs?: string;
  classifications?: string;
  avail?: string;
};

export function toProductListFilters(q: ProductListQueryParams): ProductListFilters {
  let inStockF = q.inStock;
  let outOfStockOnly = false;
  if (q.avail === 'out') {
    outOfStockOnly = true;
    inStockF = undefined;
  } else if (q.avail === 'in') {
    inStockF = true;
  }

  return {
    page: q.page,
    limit: q.limit,
    query: q.query,
    category: q.category,
    tag: q.tag,
    mustTag: q.mustTag,
    anyTags: q.anyTags,
    gender: q.gender,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    inStock: inStockF,
    outOfStockOnly,
    sizes: q.sizes,
    colors: q.colors,
    categories: q.categories,
    colSlugs: q.colSlugs,
    classifications: q.classifications,
  };
}
