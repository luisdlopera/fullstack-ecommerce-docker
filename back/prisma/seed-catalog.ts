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

  const R2_BASE_URL = 'https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev';

// R2 Product images mapping
const R2_IMAGES = {
  kids: {
    hoodie: [
      `${R2_BASE_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_1.webp`,
      `${R2_BASE_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_2.webp`,
      `${R2_BASE_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_4.webp`,
      `${R2_BASE_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_5.webp`,
      `${R2_BASE_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_6.webp`,
    ],
    basic: [
      `${R2_BASE_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_1.webp`,
      `${R2_BASE_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_3.webp`,
      `${R2_BASE_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_4.webp`,
      `${R2_BASE_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_5.webp`,
      `${R2_BASE_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_6.webp`,
    ],
    jacket: [
      `${R2_BASE_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_2.webp`,
      `${R2_BASE_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_3.webp`,
      `${R2_BASE_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_4.webp`,
      `${R2_BASE_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_6.webp`,
      `${R2_BASE_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_8.webp`,
    ],
  },
  men: {
    jacket: [
      `${R2_BASE_URL}/products/men/men-01-jacket/722606-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-01-jacket/722607-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-01-jacket/722608-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-01-jacket/722609-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-01-jacket/722611-1200-auto.webp`,
    ],
    shirt: [
      `${R2_BASE_URL}/products/men/men-02-shirt/722403-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-02-shirt/722404-1200-auto.jpeg`,
      `${R2_BASE_URL}/products/men/men-02-shirt/722405-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-02-shirt/722406-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-02-shirt/722407-1200-auto.webp`,
    ],
    pants: [
      `${R2_BASE_URL}/products/men/men-03-cargo-pants/707796-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-03-cargo-pants/707797-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-03-cargo-pants/707798-1200-auto.jpeg`,
      `${R2_BASE_URL}/products/men/men-03-cargo-pants/707799-1200-auto.webp`,
      `${R2_BASE_URL}/products/men/men-03-cargo-pants/707800-1200-auto.webp`,
    ],
  },
  women: {
    shorts: [
      `${R2_BASE_URL}/products/women/women-01-shorts/723354-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-01-shorts/723355-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-01-shorts/723356-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-01-shorts/723357-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-01-shorts/723358-1200-auto.webp`,
    ],
    body: [
      `${R2_BASE_URL}/products/women/women-02-body/723142-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-02-body/723143-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-02-body/723144-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-02-body/723145-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-02-body/723147-1200-auto.webp`,
    ],
    pants: [
      `${R2_BASE_URL}/products/women/women-03-pants/723282-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-03-pants/723283-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-03-pants/723284-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-03-pants/723285-1200-auto.webp`,
      `${R2_BASE_URL}/products/women/women-03-pants/723286-1200-auto.webp`,
    ],
  },
  new: {
    classic: [
      `${R2_BASE_URL}/products/new/new-01-classic/RA44394-2520-K01XS_1.webp`,
      `${R2_BASE_URL}/products/new/new-01-classic/RA44394-2520-K01XS_3.jpg`,
      `${R2_BASE_URL}/products/new/new-01-classic/RA44394-2520-K01XS_5.webp`,
    ],
    oversized: [
      `${R2_BASE_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_3.jpg`,
      `${R2_BASE_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_4.jpg`,
      `${R2_BASE_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_5.jpg`,
      `${R2_BASE_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_6.webp`,
      `${R2_BASE_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_7.webp`,
    ],
    linen: [
      `${R2_BASE_URL}/products/new/new-03-linen-shirt/RA44417-2510-N01XS_1.webp`,
      `${R2_BASE_URL}/products/new/new-03-linen-shirt/RA44417-2510-N01XS_2.webp`,
      `${R2_BASE_URL}/products/new/new-03-linen-shirt/RA44417-2510-N01XS_3.webp`,
      `${R2_BASE_URL}/products/new/new-03-linen-shirt/RA44417-2510-N01XS_5.webp`,
      `${R2_BASE_URL}/products/new/new-03-linen-shirt/RA44417-2510-N01_4.webp`,
    ],
  },
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

  // Kids products
  rows.push({
    title: 'Hoodie Kids Blue',
    description: 'Hoodie azul para niños, cómodo y resistente.',
    slug: 'hoodie-kids-blue',
    sku: 'KIDS-HOOD-BL-001',
    price: 49.9,
    comparePrice: 69.9,
    inStock: 15,
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    gender: Gender.kid,
    tags: ['c:azul', 'kids', 'hoodie', 'casual', 'nuevo'],
    images: R2_IMAGES.kids.hoodie,
    categorySlug: 'hoodies',
  });

  rows.push({
    title: 'Basic Set Kids',
    description: 'Set básico para niños, ideal para el día a día.',
    slug: 'basic-set-kids',
    sku: 'KIDS-SET-BAS-002',
    price: 39.9,
    inStock: 20,
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    gender: Gender.kid,
    tags: ['c:verde', 'kids', 'set', 'basics'],
    images: R2_IMAGES.kids.basic,
    categorySlug: 'camisetas',
  });

  rows.push({
    title: 'Kids Jacket Navy',
    description: 'Chaqueta navy para niños, resistente al agua.',
    slug: 'kids-jacket-navy',
    sku: 'KIDS-JACK-NV-003',
    price: 59.9,
    comparePrice: 79.9,
    inStock: 10,
    sizes: [Size.S, Size.M, Size.L],
    gender: Gender.kid,
    tags: ['c:azul', 'kids', 'jacket', 'sport'],
    images: R2_IMAGES.kids.jacket,
    categorySlug: 'chaquetas',
  });

  // Men products
  rows.push({
    title: 'Men Premium Jacket',
    description: 'Chaqueta premium para hombre, diseño urbano.',
    slug: 'men-premium-jacket',
    sku: 'MEN-JACK-PR-001',
    price: 129.9,
    comparePrice: 169.9,
    inStock: 12,
    sizes: [Size.S, Size.M, Size.L, Size.XL, Size.XXL],
    gender: Gender.men,
    tags: ['c:negro', 'premium', 'jacket', 'urban', 'nuevo'],
    images: R2_IMAGES.men.jacket,
    categorySlug: 'chaquetas',
  });

  rows.push({
    title: 'Men Casual Shirt',
    description: 'Camisa casual para hombre, perfecta para el día a día.',
    slug: 'men-casual-shirt',
    sku: 'MEN-SHIRT-CAS-002',
    price: 59.9,
    inStock: 25,
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    gender: Gender.men,
    tags: ['c:blanco', 'shirt', 'casual', 'minimal'],
    images: R2_IMAGES.men.shirt,
    categorySlug: 'camisetas',
  });

  rows.push({
    title: 'Men Cargo Pants',
    description: 'Pantalones cargo para hombre, estilo y funcionalidad.',
    slug: 'men-cargo-pants',
    sku: 'MEN-PANT-CAR-003',
    price: 79.9,
    comparePrice: 99.9,
    inStock: 18,
    sizes: [Size.S, Size.M, Size.L, Size.XL, Size.XXL],
    gender: Gender.men,
    tags: ['c:beige', 'pants', 'cargo', 'urban'],
    images: R2_IMAGES.men.pants,
    categorySlug: 'pantalones',
  });

  // Women products
  rows.push({
    title: 'Women Summer Shorts',
    description: 'Shorts de verano para mujer, frescos y cómodos.',
    slug: 'women-summer-shorts',
    sku: 'WOM-SHORT-SU-001',
    price: 39.9,
    inStock: 30,
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    gender: Gender.women,
    tags: ['c:azul', 'shorts', 'summer', 'sport'],
    images: R2_IMAGES.women.shorts,
    categorySlug: 'pantalones',
  });

  rows.push({
    title: 'Women Body Fit',
    description: 'Body fit para mujer, diseño elegante y cómodo.',
    slug: 'women-body-fit',
    sku: 'WOM-BODY-FIT-002',
    price: 49.9,
    comparePrice: 69.9,
    inStock: 22,
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    gender: Gender.women,
    tags: ['c:negro', 'body', 'elegant', 'premium', 'nuevo'],
    images: R2_IMAGES.women.body,
    categorySlug: 'vestidos',
  });

  rows.push({
    title: 'Women Classic Pants',
    description: 'Pantalones clásicos para mujer, versátiles y elegantes.',
    slug: 'women-classic-pants',
    sku: 'WOM-PANT-CL-003',
    price: 69.9,
    inStock: 16,
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    gender: Gender.women,
    tags: ['c:beige', 'pants', 'classic', 'elegant'],
    images: R2_IMAGES.women.pants,
    categorySlug: 'pantalones',
  });

  // New arrivals
  rows.push({
    title: 'Classic Oversized Tee',
    description: 'Camiseta oversized clásica, tendencia actual.',
    slug: 'classic-oversized-tee',
    sku: 'NEW-TEE-CLS-001',
    price: 44.9,
    comparePrice: 59.9,
    inStock: 35,
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    gender: Gender.unisex,
    tags: ['c:blanco', 'oversized', 'nuevo', 'trendy', 'col:core'],
    images: R2_IMAGES.new.classic,
    categorySlug: 'camisetas',
  });

  rows.push({
    title: 'Oversized Graphic Tee',
    description: 'Camiseta oversized con diseño gráfico exclusivo.',
    slug: 'oversized-graphic-tee',
    sku: 'NEW-TEE-GRA-002',
    price: 49.9,
    inStock: 28,
    sizes: [Size.S, Size.M, Size.L, Size.XL, Size.XXL],
    gender: Gender.men,
    tags: ['c:negro', 'oversized', 'graphic', 'nuevo', 'urban'],
    images: R2_IMAGES.new.oversized,
    categorySlug: 'camisetas',
  });

  rows.push({
    title: 'Linen Summer Shirt',
    description: 'Camisa de lino para verano, fresca y elegante.',
    slug: 'linen-summer-shirt',
    sku: 'NEW-SHIRT-LIN-003',
    price: 89.9,
    comparePrice: 119.9,
    inStock: 14,
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    gender: Gender.men,
    tags: ['c:beige', 'linen', 'summer', 'nuevo', 'premium'],
    images: R2_IMAGES.new.linen,
    categorySlug: 'camisetas',
  });

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
        isPrimary: idx === 0,
      })),
    });
  }

  console.log(`Catalog seed: upserted ${rows.length} products.`);
}
