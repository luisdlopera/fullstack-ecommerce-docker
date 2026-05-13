const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function normalizePagination(page?: number, limit?: number) {
  const normalizedPage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const normalizedLimit =
    Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), MAX_LIMIT) : DEFAULT_LIMIT;
  const skip = (normalizedPage - 1) * normalizedLimit;
  return { page: normalizedPage, limit: normalizedLimit, skip };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function mapFavorite(fav: {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    ProductImage: {
      url: string;
      storageKey?: string | null;
      storageProvider?: string | null;
    }[];
  };
}) {
  const firstImage = fav.product.ProductImage[0];

  return {
    productId: fav.product.id,
    slug: fav.product.slug,
    title: fav.product.title,
    price: fav.product.price,
    image: firstImage?.url ?? '',
    imageStorageKey: firstImage?.storageKey ?? null,
    imageStorageProvider: firstImage?.storageProvider ?? null,
  };
}
