export type CollectionSlug = 'men' | 'women' | 'kids' | 'new';

export type ProductBadgeKind = 'new' | 'soldOut' | 'discount';

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  image2?: string;
  isNew: boolean;
  isSoldOut: boolean;
  discountPercent: number;
  categoryName: string;
  collection: CollectionSlug;
  sizes: string[];
  colors: string[];
  tags: string[];
  collections: string[];
  classification: string[];
};

export type AvailabilityFilterMode = 'all' | 'inStock' | 'outOfStock';

export type SidebarDraftFilters = {
  sizes: string[];
  availability: AvailabilityFilterMode;
  categories: string[];
  colors: string[];
  priceMin: number | null;
  priceMax: number | null;
  collections: string[];
  tags: string[];
  classifications: string[];
};

export type ActiveFilters = SidebarDraftFilters & { searchQuery: string };