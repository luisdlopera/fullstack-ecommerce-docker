import { Prisma, Size } from '@prisma/client';
import type { ProductListFilters } from '../../domain/ports/product-repository.port';

function parseCsv(v?: string): string[] {
  return (
    v
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

function mapUiSizeToPrismaSize(s: string): Size | null {
  const key = s.trim();
  const upper = key.toUpperCase();
  const map: Record<string, Size> = {
    XS: Size.XS,
    S: Size.S,
    M: Size.M,
    L: Size.L,
    XL: Size.XL,
    XXL: Size.XXL,
    XXXL: Size.XXXL,
    '2X': Size.XXL,
  };
  return map[key] ?? map[upper] ?? null;
}

/** Shared filter semantics for list + facets endpoints. */
export function buildProductListWhere(filters: ProductListFilters): Prisma.ProductWhereInput {
  const andParts: Prisma.ProductWhereInput[] = [{ deletedAt: null }, { isActive: true }];

  if (filters.query) {
    andParts.push({
      title: { contains: filters.query, mode: 'insensitive' },
    });
  }

  const mustTag = filters.mustTag ?? filters.tag;
  if (mustTag) {
    andParts.push({ tags: { has: mustTag.toLowerCase() } });
  }

  const anyTagList = parseCsv(filters.anyTags);
  if (anyTagList.length > 0) {
    andParts.push({
      OR: anyTagList.map((t) => ({ tags: { has: t.toLowerCase() } })),
    });
  }

  if (filters.gender) {
    andParts.push({ gender: filters.gender as 'men' | 'women' | 'kid' | 'unisex' });
  }

  const categories = parseCsv(filters.categories);
  if (filters.category) {
    categories.push(filters.category);
  }
  if (categories.length > 0) {
    const uniq = [...new Set(categories)];
    andParts.push({
      OR: uniq.map((name) => ({
        category: { name: { equals: name, mode: 'insensitive' } },
      })),
    });
  }

  const priceFilter: Prisma.FloatFilter = {};
  if (filters.minPrice != null) priceFilter.gte = filters.minPrice;
  if (filters.maxPrice != null) priceFilter.lte = filters.maxPrice;
  if (Object.keys(priceFilter).length > 0) {
    andParts.push({ price: priceFilter });
  }

  if (filters.outOfStockOnly) {
    andParts.push({ inStock: 0 });
  } else if (filters.inStock) {
    andParts.push({ inStock: { gt: 0 } });
  }

  const sizes = parseCsv(filters.sizes);
  const sizeEnums = sizes.map(mapUiSizeToPrismaSize).filter((x): x is Size => x != null);
  if (sizeEnums.length > 0) {
    andParts.push({
      OR: sizeEnums.map((sz) => ({ sizes: { has: sz } })),
    });
  }

  const colors = parseCsv(filters.colors);
  if (colors.length > 0) {
    andParts.push({
      OR: colors.map((c: string) => ({ tags: { has: `c:${c.toLowerCase()}` } })),
    });
  }

  const colSlugs = parseCsv(filters.colSlugs);
  if (colSlugs.length > 0) {
    andParts.push({
      OR: colSlugs.map((slug) => ({ tags: { has: `col:${slug.toLowerCase()}` } })),
    });
  }

  const classifications = parseCsv(filters.classifications);
  if (classifications.length > 0) {
    andParts.push({
      OR: classifications.map((slug) => ({ tags: { has: `class:${slug.toLowerCase()}` } })),
    });
  }

  return { AND: andParts };
}
