/** Repository port for catalog reads (shop-facing). No framework / Prisma types. */

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export type ProductListFilters = {
  page?: number;
  limit?: number;
  query?: string;
  /** @deprecated Prefer mustTag */
  tag?: string;
  category?: string;
  mustTag?: string;
  /** Comma-separated; OR semantics on tags */
  anyTags?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  outOfStockOnly?: boolean;
  sizes?: string;
  colors?: string;
  categories?: string;
  colSlugs?: string;
  classifications?: string;
};

export type ProductImageRecord = { id: number; url: string; sortOrder?: number };

export type CategoryRecord = { id: string; name: string };

export type ProductListItem = {
  id: string;
  title: string;
  description: string;
  inStock: number;
  price: number;
  comparePrice: number | null;
  sizes: string[];
  slug: string;
  tags: string[];
  gender: string;
  categoryId: string;
  ProductImage: ProductImageRecord[];
  category: CategoryRecord;
};

export type FeaturedProductRecord = {
  id: string;
  title: string;
  price: number;
  slug: string;
  gender: string;
  tags: string[];
  ProductImage: ProductImageRecord[];
};

export type ProductListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  data: ProductListItem[];
  meta: ProductListMeta;
};

export type ProductStockRecord = {
  id: string;
  slug: string;
  inStock: number;
};

export type ProductFacetsResult = {
  inStockCount: number;
  outOfStockCount: number;
  categoryNames: string[];
};

export type CountryRecord = {
  id: string;
  name: string;
  isoCode: string | null;
  currency: string;
  isActive: boolean;
  allowsShipping: boolean;
  allowsPurchase: boolean;
};

export interface ProductRepositoryPort {
  findFeatured(limit: number): Promise<FeaturedProductRecord[]>;
  list(filters: ProductListFilters): Promise<ProductListResult>;
  facets(filters: ProductListFilters): Promise<ProductFacetsResult>;
  findBySlug(slug: string): Promise<ProductListItem | null>;
  findStockBySlug(slug: string): Promise<ProductStockRecord | null>;
  findAllCategories(): Promise<CategoryRecord[]>;
  findAllCountries(): Promise<CountryRecord[]>;
}
