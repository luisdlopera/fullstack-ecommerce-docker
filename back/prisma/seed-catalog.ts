import type { PrismaClient } from '@prisma/client';
import { Gender, Size } from '@prisma/client';

/**
 * Extra catalog / PLP demo products — separate from core seed data.
 * Invoked from prisma/seed.ts after categories and base data exist.
 */
export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  console.log('Seeding catalog (PLP demo products)...');

  const categories = await prisma.category.findMany({
    where: { slug: { in: ['camisetas', 'hoodies', 'pantalones', 'vestidos', 'chaquetas', 'accesorios'] } },
  });
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const pickCat = (slug: string) => {
    const id = bySlug.get(slug);
    if (!id) throw new Error(`Catalog seed: missing category ${slug}`);
    return id;
  };

  type CatalogRow = {
    title: string;
    description: string;
    slug: string;
    sku: string;
    price: number;
    comparePrice?: number;
    inStock: number;
    sizes: Size[];
    gender: Gender;
    tags: string[];
    images: string[];
    categorySlug: string;
  };

  const imgs = (i: number) =>
    i % 2 === 0
      ? ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png']
      : ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'];

  const allSizes = [Size.XS, Size.S, Size.M, Size.L, Size.XL, Size.XXL];
  const midSizes = [Size.S, Size.M, Size.L, Size.XL];

  const rows: CatalogRow[] = [];

  const menCats = ['camisetas', 'hoodies', 'pantalones', 'chaquetas'] as const;
  const womenCats = ['camisetas', 'vestidos', 'chaquetas', 'accesorios'] as const;
  const kidCats = ['camisetas', 'hoodies', 'pantalones'] as const;

  const colorTags = ['c:negro', 'c:blanco', 'c:azul', 'c:beige', 'c:verde'] as const;
  const labelTags = ['urban', 'sport', 'minimal', 'premium'] as const;
  const classTags = ['class:essential', 'class:limited', 'class:runway'] as const;
  const collectionTags = ['col:core', 'col:studio', 'col:travel'] as const;

  for (let i = 1; i <= 14; i++) {
    const color = colorTags[i % colorTags.length];
    const label = labelTags[i % labelTags.length];
    const klass = classTags[i % classTags.length];
    const col = collectionTags[i % collectionTags.length];
    const cat = menCats[i % menCats.length];
    const stock = i % 7 === 0 ? 0 : 12 + (i % 40);
    rows.push({
      title: `NEX Men Line ${i}`,
      description: `Pieza masculina de línea catálogo ${i}, corte contemporáneo.`,
      slug: `catalog-men-line-${i}`,
      sku: `CAT-M-LN-${String(i).padStart(3, '0')}`,
      price: 79.9 + i * 4,
      comparePrice: i % 3 === 0 ? 79.9 + i * 4 + 35 : undefined,
      inStock: stock,
      sizes: i % 5 === 0 ? [Size.M, Size.L] : midSizes,
      gender: Gender.men,
      tags: [color, label, klass, col, i % 4 === 0 ? 'nuevo' : 'basics'].map((t) => t.toLowerCase()),
      images: imgs(i),
      categorySlug: cat,
    });
  }

  for (let i = 1; i <= 14; i++) {
    const color = colorTags[(i + 2) % colorTags.length];
    const label = labelTags[(i + 1) % labelTags.length];
    const klass = classTags[(i + 2) % classTags.length];
    const col = collectionTags[(i + 1) % collectionTags.length];
    const cat = womenCats[i % womenCats.length];
    const stock = i % 8 === 0 ? 0 : 10 + (i % 35);
    rows.push({
      title: `NEX Woman Atelier ${i}`,
      description: `Diseño femenino atelier ${i}, texturas y silueta premium.`,
      slug: `catalog-woman-atelier-${i}`,
      sku: `CAT-W-AT-${String(i).padStart(3, '0')}`,
      price: 89.9 + i * 5,
      comparePrice: i % 4 === 0 ? 89.9 + i * 5 + 40 : undefined,
      inStock: stock,
      sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL].filter((_, idx) => idx !== i % 5),
      gender: Gender.women,
      tags: [color, label, klass, col, i % 3 === 0 ? 'nuevo' : 'elegante'].map((t) => t.toLowerCase()),
      images: imgs(i + 3),
      categorySlug: cat,
    });
  }

  for (let i = 1; i <= 10; i++) {
    const color = colorTags[(i + 1) % colorTags.length];
    const cat = kidCats[i % kidCats.length];
    const stock = i % 6 === 0 ? 0 : 20 + (i % 25);
    rows.push({
      title: `NEX Kids Play ${i}`,
      description: `Prenda infantil resistente y cómoda, modelo ${i}.`,
      slug: `catalog-kids-play-${i}`,
      sku: `CAT-K-PL-${String(i).padStart(3, '0')}`,
      price: 49.9 + i * 3,
      comparePrice: i % 5 === 0 ? 49.9 + i * 3 + 20 : undefined,
      inStock: stock,
      sizes: [Size.XS, Size.S, Size.M, Size.L].slice(0, 3 + (i % 2)),
      gender: Gender.kid,
      tags: [color, 'kids', 'fun', i % 2 === 0 ? 'nuevo' : 'active'].map((t) => t.toLowerCase()),
      images: imgs(i + 1),
      categorySlug: cat,
    });
  }
  for (let i = 1; i <= 12; i++) {
    const color = colorTags[i % colorTags.length];
    const stock = i % 9 === 0 ? 0 : 8 + (i % 20);
    rows.push({
      title: `NEX New Drop ${i}`,
      description: `Lanzamiento temporada — pieza ${i} de la colección nueva.`,
      slug: `catalog-new-drop-${i}`,
      sku: `CAT-N-DR-${String(i).padStart(3, '0')}`,
      price: 99.9 + i * 6,
      comparePrice: i % 2 === 0 ? 99.9 + i * 6 + 45 : undefined,
      inStock: stock,
      sizes: allSizes.filter((_, idx) => idx % 2 === i % 2),
      gender: i % 3 === 0 ? Gender.unisex : i % 3 === 1 ? Gender.men : Gender.women,
      tags: ['nuevo', color, labelTags[i % labelTags.length], collectionTags[i % collectionTags.length]].map((t) =>
        t.toLowerCase(),
      ),
      images: imgs(i + 2),
      categorySlug: 'camisetas',
    });
  }

  for (const productData of rows) {
    const categoryId = pickCat(productData.categorySlug);

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        title: productData.title,
        description: productData.description,
        sku: productData.sku,
        inStock: productData.inStock,
        price: productData.price,
        comparePrice: productData.comparePrice,
        sizes: productData.sizes,
        tags: productData.tags.map((t) => t.toLowerCase()),
        gender: productData.gender,
        categoryId,
        featured: productData.tags.some((t) => t.toLowerCase() === 'nuevo'),
      },
      create: {
        title: productData.title,
        description: productData.description,
        sku: productData.sku,
        inStock: productData.inStock,
        price: productData.price,
        comparePrice: productData.comparePrice,
        sizes: productData.sizes,
        slug: productData.slug,
        tags: productData.tags.map((t) => t.toLowerCase()),
        gender: productData.gender,
        categoryId,
        featured: productData.tags.some((t) => t.toLowerCase() === 'nuevo'),
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: productData.images.map((url, idx) => ({
        url,
        productId: product.id,
        sortOrder: idx,
      })),
    });
  }

  console.log(`Catalog seed: upserted ${rows.length} products.`);
}
