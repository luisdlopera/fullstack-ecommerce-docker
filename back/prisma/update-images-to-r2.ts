import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/infrastructure/prisma/prisma-client-options';

// Load env
config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient(createPrismaClientOptions());

const STORAGE_PUBLIC_URL = 'http://localhost:5010/nexstore-products';

// Product image mapping
const PRODUCT_IMAGES: Record<string, string[]> = {
  // Men products
  'camiseta-hombre-essential': [
    `${STORAGE_PUBLIC_URL}/products/men/men-02-shirt/722403-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/men/men-02-shirt/722404-1200-auto.jpeg`,
  ],
  'hoodie-hombre-urban': [
    `${STORAGE_PUBLIC_URL}/products/men/men-01-jacket/722606-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/men/men-01-jacket/722607-1200-auto.webp`,
  ],
  'jogger-hombre-sport': [
    `${STORAGE_PUBLIC_URL}/products/men/men-03-cargo-pants/707796-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/men/men-03-cargo-pants/707797-1200-auto.webp`,
  ],
  // Women products
  'blusa-mujer-minimal': [
    `${STORAGE_PUBLIC_URL}/products/women/women-01-shorts/723354-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/women/women-01-shorts/723355-1200-auto.webp`,
  ],
  'vestido-mujer-breeze': [
    `${STORAGE_PUBLIC_URL}/products/women/women-02-body/723142-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/women/women-02-body/723143-1200-auto.webp`,
  ],
  'chaqueta-mujer-denim': [
    `${STORAGE_PUBLIC_URL}/products/women/women-03-pants/723282-1200-auto.webp`,
    `${STORAGE_PUBLIC_URL}/products/women/women-03-pants/723283-1200-auto.webp`,
  ],
  // Kids products
  'camiseta-nino-fun': [
    `${STORAGE_PUBLIC_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_1.webp`,
    `${STORAGE_PUBLIC_URL}/products/kids/kids-01-hoodie-blue/RJ44293-2520-Z5O5Y_2.webp`,
  ],
  'sudadera-nino-active': [
    `${STORAGE_PUBLIC_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_1.webp`,
    `${STORAGE_PUBLIC_URL}/products/kids/kids-02-basic-set/RJ46313-2424-G045Y_3.webp`,
  ],
  'pantalon-nino-play': [
    `${STORAGE_PUBLIC_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_2.webp`,
    `${STORAGE_PUBLIC_URL}/products/kids/kids-03-jacket/RJ41346-2510-N015Y_3.webp`,
  ],
  // New/unisex products
  'coleccion-eclipse': [
    `${STORAGE_PUBLIC_URL}/products/new/new-01-classic/RA44394-2520-K01XS_1.webp`,
    `${STORAGE_PUBLIC_URL}/products/new/new-01-classic/RA44394-2520-K01XS_3.jpg`,
  ],
  'coleccion-nova': [
    `${STORAGE_PUBLIC_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_3.jpg`,
    `${STORAGE_PUBLIC_URL}/products/new/new-02-oversized-tee/RA44425-2520-KZ0XS_4.jpg`,
  ],
};

async function main() {
  console.log('Updating product images to R2 URLs...');

  for (const [slug, imageUrls] of Object.entries(PRODUCT_IMAGES)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { ProductImage: true },
    });

    if (!product) {
      console.log(`Product not found: ${slug}`);
      continue;
    }

    // Delete existing images
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    // Create new images with R2 URLs
    await prisma.productImage.createMany({
      data: imageUrls.map((url, idx) => ({
        url,
        productId: product.id,
        sortOrder: idx,
        isPrimary: idx === 0,
      })),
    });

    console.log(`Updated ${slug} with ${imageUrls.length} R2 images`);
  }

  console.log('Product image update complete!');
}

main()
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
