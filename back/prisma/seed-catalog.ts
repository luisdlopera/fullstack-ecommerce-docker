import { Gender, Size } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// R2 BUCKET IMAGE MAP - Source of truth for seed images
// All paths are relative to the bucket root (storageKey format)
// Public URL base: https://pub-e14c4ed4e514428faeb13ca8f02c15a7.r2.dev
// =============================================================================

// Home slider images - Using .webp extension as per R2 bucket
const HOME_SLIDER_IMAGES = [
  'home/slider/slider-1.webp',
  'home/slider/slider-2.webp',
  'home/slider/slider-3.webp',
];

// Kids category images (3 products)
const KIDS_IMAGES: Record<string, string[]> = {
  'kids-01-hoodie-blue': [
    'products/kids/kids-01-hoodie-blue/714781-1200-auto.webp',
    'products/kids/kids-01-hoodie-blue/714782-1200-auto.webp',
    'products/kids/kids-01-hoodie-blue/714783-1200-auto.webp',
  ],
  'kids-02-basic-set': [
    'products/kids/kids-02-basic-set/706295-1200-auto.webp',
    'products/kids/kids-02-basic-set/706296-1200-auto.webp',
    'products/kids/kids-02-basic-set/706297-1200-auto.webp',
  ],
  'kids-03-jacket': [
    'products/kids/kids-03-jacket/723422-1200-auto.webp',
    'products/kids/kids-03-jacket/723423-1200-auto.webp',
    'products/kids/kids-03-jacket/723424-1200-auto.webp',
  ],
};

// Men category images (4 products)
const MEN_IMAGES: Record<string, string[]> = {
  'men-01-jacket': [
    'products/men/men-01-jacket/722606-1200-auto.webp',
    'products/men/men-01-jacket/722607-1200-auto.webp',
    'products/men/men-01-jacket/722608-1200-auto.webp',
    'products/men/men-01-jacket/722609-1200-auto.webp',
    'products/men/men-01-jacket/722611-1200-auto.webp',
  ],
  'men-02-shirt': [
    'products/men/men-02-shirt/722403-1200-auto.webp',
    'products/men/men-02-shirt/722404-1200-auto.jpeg',
    'products/men/men-02-shirt/722405-1200-auto.webp',
    'products/men/men-02-shirt/722406-1200-auto.webp',
    'products/men/men-02-shirt/722407-1200-auto.webp',
  ],
  'men-03-cargo-pants': [
    'products/men/men-03-cargo-pants/707796-1200-auto.webp',
    'products/men/men-03-cargo-pants/707797-1200-auto.webp',
    'products/men/men-03-cargo-pants/707798-1200-auto.jpeg',
    'products/men/men-03-cargo-pants/707799-1200-auto.webp',
    'products/men/men-03-cargo-pants/707800-1200-auto.webp',
  ],
  'men-04-shirt-black': [
    'products/men/men-04-shirt-black/shirt-black-1.png',
    'products/men/men-04-shirt-black/shirt-black-2.png',
    'products/men/men-04-shirt-black/shirt-black-3.png',
    'products/men/men-04-shirt-black/shirt-black-4.png',
    'products/men/men-04-shirt-black/shirt-black-5.png',
  ],
};

// New arrivals images (3 products)
const NEW_IMAGES: Record<string, string[]> = {
  'new-01-classic': [
    'products/new/new-01-classic/713830-1200-auto.webp',
    'products/new/new-01-classic/713831-1200-auto.webp',
    'products/new/new-01-classic/713832-1200-auto.webp',
    'products/new/new-01-classic/713833-1200-auto.webp',
    'products/new/new-01-classic/713834-1200-auto.webp',
  ],
  'new-02-oversized-tee': [
    'products/new/new-02-oversized-tee/714666-1200-auto.webp',
    'products/new/new-02-oversized-tee/714667-1200-auto.webp',
    'products/new/new-02-oversized-tee/714668-1200-auto.webp',
    'products/new/new-02-oversized-tee/714669-1200-auto.webp',
    'products/new/new-02-oversized-tee/714670-1200-auto.webp',
  ],
  'new-03-linen-shirt': [
    'products/new/new-03-linen-shirt/702692-1200-auto.webp',
    'products/new/new-03-linen-shirt/702693-1200-auto.webp',
    'products/new/new-03-linen-shirt/702694-1200-auto.webp',
    'products/new/new-03-linen-shirt/702695-1200-auto.webp',
    'products/new/new-03-linen-shirt/702697-1200-auto.webp',
  ],
};

// Women category images (5 products)
// Note: woman-04-dress uses singular "woman" as per actual bucket structure
const WOMEN_IMAGES: Record<string, string[]> = {
  'woman-04-dress': [
    'products/women/woman-04-dress/722630-1200-auto.webp',
    'products/women/woman-04-dress/722631-1200-auto.webp',
    'products/women/woman-04-dress/722632-1200-auto.webp',
    'products/women/woman-04-dress/722633-1200-auto.webp',
    'products/women/woman-04-dress/722634-1200-auto.webp',
  ],
  'women-01-shorts': [
    'products/women/women-01-shorts/723354-1200-auto.webp',
    'products/women/women-01-shorts/723355-1200-auto.webp',
    'products/women/women-01-shorts/723356-1200-auto.webp',
    'products/women/women-01-shorts/723357-1200-auto.webp',
    'products/women/women-01-shorts/723358-1200-auto.webp',
  ],
  'women-02-body': [
    'products/women/women-02-body/723142-1200-auto.webp',
    'products/women/women-02-body/723143-1200-auto.webp',
    'products/women/women-02-body/723144-1200-auto.webp',
    'products/women/women-02-body/723145-1200-auto.webp',
    'products/women/women-02-body/723147-1200-auto.webp',
  ],
  'women-03-pants': [
    'products/women/women-03-pants/723282-1200-auto.webp',
    'products/women/women-03-pants/723283-1200-auto.webp',
    'products/women/women-03-pants/723284-1200-auto.webp',
    'products/women/women-03-pants/723285-1200-auto.webp',
    'products/women/women-03-pants/723286-1200-auto.webp',
  ],
  'women-05-shirt': [
    'products/women/women-05-shirt/722347-1200-auto.webp',
    'products/women/women-05-shirt/722348-1200-auto.webp',
    'products/women/women-05-shirt/722349-1200-auto.webp',
    'products/women/women-05-shirt/722350-1200-auto.webp',
    'products/women/women-05-shirt/722351-1200-auto.webp',
    'products/women/women-05-shirt/722352-1200-auto.webp',
  ],
};

// =============================================================================
// PRODUCT DEFINITIONS
// =============================================================================

const kidsProducts: Array<{
  slug: string;
  title: string;
  description: string;
  price: number;
  categorySlug: string;
  gender: Gender;
  sizes: Size[];
  tags: string[];
  folder: string;
  featured?: boolean;
}> = [
  {
    slug: 'kids-01-hoodie-blue',
    title: 'Hoodie Kids Blue',
    description: 'Comfortable blue hoodie for kids, perfect for everyday wear.',
    price: 49.9,
    categorySlug: 'hoodies',
    gender: 'kid',
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    tags: ['kids', 'hoodie', 'blue', 'casual'],
    folder: 'kids-01-hoodie-blue',
    featured: true,
  },
  {
    slug: 'kids-02-basic-set',
    title: 'Kids Basic Set',
    description: 'Essential basic clothing set for kids.',
    price: 39.9,
    categorySlug: 'camisetas',
    gender: 'kid',
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    tags: ['kids', 'basic', 'set', 'essential'],
    folder: 'kids-02-basic-set',
    featured: true,
  },
  {
    slug: 'kids-03-jacket',
    title: 'Kids Lightweight Jacket',
    description: 'Stylish lightweight jacket for kids.',
    price: 59.9,
    categorySlug: 'chaquetas',
    gender: 'kid',
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    tags: ['kids', 'jacket', 'outerwear', 'casual'],
    folder: 'kids-03-jacket',
    featured: true,
  },
];

const menProducts: Array<{
  slug: string;
  title: string;
  description: string;
  price: number;
  categorySlug: string;
  gender: Gender;
  sizes: Size[];
  tags: string[];
  folder: string;
  featured?: boolean;
}> = [
  {
    slug: 'men-01-jacket',
    title: 'Men Premium Jacket',
    description: 'High-quality jacket for men with modern styling.',
    price: 129.9,
    categorySlug: 'chaquetas',
    gender: 'men',
    sizes: [Size.S, Size.M, Size.L, Size.XL, Size.XXL],
    tags: ['men', 'jacket', 'premium', 'outerwear'],
    folder: 'men-01-jacket',
    featured: true,
  },
  {
    slug: 'men-02-shirt',
    title: 'Men Casual Shirt',
    description: 'Comfortable casual shirt for everyday wear.',
    price: 59.9,
    categorySlug: 'camisetas',
    gender: 'men',
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    tags: ['men', 'shirt', 'casual', 'cotton'],
    folder: 'men-02-shirt',
    featured: true,
  },
  {
    slug: 'men-03-cargo-pants',
    title: 'Men Cargo Pants',
    description: 'Functional cargo pants with multiple pockets.',
    price: 79.9,
    categorySlug: 'pantalones',
    gender: 'men',
    sizes: [Size.S, Size.M, Size.L, Size.XL, Size.XXL],
    tags: ['men', 'pants', 'cargo', 'casual'],
    folder: 'men-03-cargo-pants',
    featured: true,
  },
  {
    slug: 'men-04-shirt-black',
    title: 'Men Black Classic Shirt',
    description: 'Classic black shirt for any occasion.',
    price: 54.9,
    categorySlug: 'camisetas',
    gender: 'men',
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    tags: ['men', 'shirt', 'black', 'classic'],
    folder: 'men-04-shirt-black',
    featured: true,
  },
];

const newProducts: Array<{
  slug: string;
  title: string;
  description: string;
  price: number;
  categorySlug: string;
  gender: Gender;
  sizes: Size[];
  tags: string[];
  folder: string;
  featured?: boolean;
}> = [
  {
    slug: 'new-01-classic',
    title: 'Classic Collection Tee',
    description: 'Classic style t-shirt from our new collection.',
    price: 44.9,
    categorySlug: 'camisetas',
    gender: 'unisex',
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    tags: ['new', 'classic', 't-shirt', 'unisex'],
    folder: 'new-01-classic',
    featured: true,
  },
  {
    slug: 'new-02-oversized-tee',
    title: 'Classic Oversized Tee',
    description: 'Trendy oversized t-shirt with modern fit.',
    price: 49.9,
    categorySlug: 'camisetas',
    gender: 'unisex',
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    tags: ['new', 'oversized', 't-shirt', 'trendy'],
    folder: 'new-02-oversized-tee',
    featured: true,
  },
  {
    slug: 'new-03-linen-shirt',
    title: 'Linen Summer Shirt',
    description: 'Breathable linen shirt perfect for summer.',
    price: 69.9,
    categorySlug: 'camisetas',
    gender: 'men',
    sizes: [Size.S, Size.M, Size.L, Size.XL],
    tags: ['new', 'linen', 'shirt', 'summer'],
    folder: 'new-03-linen-shirt',
    featured: true,
  },
];

const womenProducts: Array<{
  slug: string;
  title: string;
  description: string;
  price: number;
  categorySlug: string;
  gender: Gender;
  sizes: Size[];
  tags: string[];
  folder: string;
  featured?: boolean;
}> = [
  {
    slug: 'woman-04-dress',
    title: 'Elegant Summer Dress',
    description: 'Beautiful summer dress for any occasion.',
    price: 89.9,
    categorySlug: 'vestidos',
    gender: 'women',
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    tags: ['women', 'dress', 'summer', 'elegant'],
    folder: 'woman-04-dress',
    featured: true,
  },
  {
    slug: 'women-01-shorts',
    title: 'Women Casual Shorts',
    description: 'Comfortable casual shorts for everyday wear.',
    price: 39.9,
    categorySlug: 'pantalones',
    gender: 'women',
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    tags: ['women', 'shorts', 'casual', 'summer'],
    folder: 'women-01-shorts',
    featured: true,
  },
  {
    slug: 'women-02-body',
    title: 'Women Body Suit',
    description: 'Stylish body suit for women.',
    price: 45.9,
    categorySlug: 'camisetas',
    gender: 'women',
    sizes: [Size.XS, Size.S, Size.M, Size.L],
    tags: ['women', 'body', 'casual', 'fitted'],
    folder: 'women-02-body',
    featured: true,
  },
  {
    slug: 'women-03-pants',
    title: 'Women Elegant Pants',
    description: 'Elegant pants perfect for any occasion.',
    price: 79.9,
    categorySlug: 'pantalones',
    gender: 'women',
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    tags: ['women', 'pants', 'elegant', 'formal'],
    folder: 'women-03-pants',
    featured: true,
  },
  {
    slug: 'women-05-shirt',
    title: 'Women Premium Shirt',
    description: 'Premium quality shirt for women.',
    price: 64.9,
    categorySlug: 'camisetas',
    gender: 'women',
    sizes: [Size.XS, Size.S, Size.M, Size.L, Size.XL],
    tags: ['women', 'shirt', 'premium', 'casual'],
    folder: 'women-05-shirt',
    featured: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getImages(folder: string, category: 'kids' | 'men' | 'new' | 'women'): string[] {
  switch (category) {
    case 'kids':
      return KIDS_IMAGES[folder] || [];
    case 'men':
      return MEN_IMAGES[folder] || [];
    case 'new':
      return NEW_IMAGES[folder] || [];
    case 'women':
      return WOMEN_IMAGES[folder] || [];
    default:
      return [];
  }
}

// =============================================================================
// SEED FUNCTION
// =============================================================================

export async function seedCatalog(prisma: PrismaClient) {
  console.log('Seeding catalog from R2 bucket...');

  // Get or create categories
  const categories: Record<string, string> = {};
  const categorySlugs = ['hoodies', 'camisetas', 'pantalones', 'vestidos', 'chaquetas'];
  
  for (const slug of categorySlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (cat) {
      categories[slug] = cat.id;
    }
  }

  // Seed Kids products
  console.log('Seeding kids products...');
  for (const product of kidsProducts) {
    const images = getImages(product.folder, 'kids');
    if (images.length === 0) {
      console.warn(`No images found for ${product.slug}, skipping...`);
      continue;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existingProduct) {
      const newProduct = await prisma.product.create({
        data: {
          slug: product.slug,
          title: product.title,
          description: product.description,
          price: product.price,
          comparePrice: product.price * 1.2,
          categoryId: categories[product.categorySlug],
          gender: product.gender,
          sizes: product.sizes,
          tags: product.tags,
          inStock: 50,
          isActive: true,
          featured: product.featured || false,
          sku: `SKU-${product.slug.toUpperCase().replace(/-/g, '_')}`,
        },
      });

      // Create product images with storageKey only (no full URL)
      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: newProduct.id,
            url: images[i], // This is the storageKey (path)
            storageKey: images[i],
            storageProvider: 'r2',
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }

      console.log(`Created product: ${product.title} with ${images.length} images`);
    } else {
      console.log(`Product ${product.slug} already exists, skipping...`);
    }
  }

  // Seed Men products
  console.log('Seeding men products...');
  for (const product of menProducts) {
    const images = getImages(product.folder, 'men');
    if (images.length === 0) {
      console.warn(`No images found for ${product.slug}, skipping...`);
      continue;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existingProduct) {
      const newProduct = await prisma.product.create({
        data: {
          slug: product.slug,
          title: product.title,
          description: product.description,
          price: product.price,
          comparePrice: product.price * 1.2,
          categoryId: categories[product.categorySlug],
          gender: product.gender,
          sizes: product.sizes,
          tags: product.tags,
          inStock: 50,
          isActive: true,
          featured: product.featured || false,
          sku: `SKU-${product.slug.toUpperCase().replace(/-/g, '_')}`,
        },
      });

      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: newProduct.id,
            url: images[i],
            storageKey: images[i],
            storageProvider: 'r2',
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }

      console.log(`Created product: ${product.title} with ${images.length} images`);
    }
  }

  // Seed New products
  console.log('Seeding new arrivals...');
  for (const product of newProducts) {
    const images = getImages(product.folder, 'new');
    if (images.length === 0) {
      console.warn(`No images found for ${product.slug}, skipping...`);
      continue;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existingProduct) {
      const newProduct = await prisma.product.create({
        data: {
          slug: product.slug,
          title: product.title,
          description: product.description,
          price: product.price,
          comparePrice: product.price * 1.2,
          categoryId: categories[product.categorySlug],
          gender: product.gender,
          sizes: product.sizes,
          tags: product.tags,
          inStock: 50,
          isActive: true,
          featured: product.featured || false,
          sku: `SKU-${product.slug.toUpperCase().replace(/-/g, '_')}`,
        },
      });

      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: newProduct.id,
            url: images[i],
            storageKey: images[i],
            storageProvider: 'r2',
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }

      console.log(`Created product: ${product.title} with ${images.length} images`);
    }
  }

  // Seed Women products
  console.log('Seeding women products...');
  for (const product of womenProducts) {
    const images = getImages(product.folder, 'women');
    if (images.length === 0) {
      console.warn(`No images found for ${product.slug}, skipping...`);
      continue;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existingProduct) {
      const newProduct = await prisma.product.create({
        data: {
          slug: product.slug,
          title: product.title,
          description: product.description,
          price: product.price,
          comparePrice: product.price * 1.2,
          categoryId: categories[product.categorySlug],
          gender: product.gender,
          sizes: product.sizes,
          tags: product.tags,
          inStock: 50,
          isActive: true,
          featured: product.featured || false,
          sku: `SKU-${product.slug.toUpperCase().replace(/-/g, '_')}`,
        },
      });

      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: newProduct.id,
            url: images[i],
            storageKey: images[i],
            storageProvider: 'r2',
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }

      console.log(`Created product: ${product.title} with ${images.length} images`);
    }
  }

  // Create home banners from slider images
  console.log('Seeding home banners...');
  const bannerTitles = [
    'Spring Collection 2025',
    'Summer Essentials',
    'New Arrivals',
  ];

  for (let i = 0; i < HOME_SLIDER_IMAGES.length; i++) {
    const existingBanner = await prisma.homeBanner.findFirst({
      where: { 
        storageKey: HOME_SLIDER_IMAGES[i],
      },
    });

    if (!existingBanner) {
      await prisma.homeBanner.create({
        data: {
          title: bannerTitles[i],
          storageKey: HOME_SLIDER_IMAGES[i],
          storageProvider: 'r2',
          // Guardar solo el path, no la URL completa
          imageUrl: HOME_SLIDER_IMAGES[i],
          ctaLink: i === 2 ? '/new-arrivals' : '/products',
          ctaText: 'Shop Now',
          sortOrder: i,
          isActive: true,
        },
      });
      console.log(`Created banner: ${bannerTitles[i]}`);
    }
  }

  console.log('Catalog seed completed successfully!');
}
