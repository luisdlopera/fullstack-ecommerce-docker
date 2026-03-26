import { config } from 'dotenv';
import { resolve } from 'node:path';
import bcryptjs from 'bcryptjs';
import { Gender, OrderStatus, PrismaClient, Role, Size } from '@prisma/client';

// Monorepo: allow `npm run prisma:seed -w back` with `.env` at repo root.
config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Countries ─────────────────────────────────────────────────────────
  const countries = [
    { id: 'CO', name: 'Colombia', isoCode: 'CO', currency: 'COP', priority: 10 },
    { id: 'MX', name: 'México', isoCode: 'MX', currency: 'MXN', priority: 9 },
    { id: 'AR', name: 'Argentina', isoCode: 'AR', currency: 'ARS', priority: 8 },
    { id: 'CL', name: 'Chile', isoCode: 'CL', currency: 'CLP', priority: 7 },
    { id: 'PE', name: 'Perú', isoCode: 'PE', currency: 'PEN', priority: 6 },
    { id: 'US', name: 'United States', isoCode: 'US', currency: 'USD', priority: 5 },
    { id: 'ES', name: 'España', isoCode: 'ES', currency: 'EUR', priority: 4 }
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: { name: country.name, isoCode: country.isoCode, currency: country.currency, priority: country.priority },
      create: country
    });
  }

  // ── Categories ────────────────────────────────────────────────────────
  const categoriesData = [
    { name: 'Camisetas', slug: 'camisetas', description: 'Camisetas para toda ocasión', sortOrder: 1 },
    { name: 'Hoodies', slug: 'hoodies', description: 'Sudaderas y hoodies', sortOrder: 2 },
    { name: 'Pantalones', slug: 'pantalones', description: 'Pantalones y joggers', sortOrder: 3 },
    { name: 'Vestidos', slug: 'vestidos', description: 'Vestidos para mujer', sortOrder: 4 },
    { name: 'Chaquetas', slug: 'chaquetas', description: 'Chaquetas y abrigos', sortOrder: 5 },
    { name: 'Accesorios', slug: 'accesorios', description: 'Gorras, bolsos y más', sortOrder: 6 }
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat
    });
    categoryMap.set(cat.slug, category.id);
  }

  // ── Products ──────────────────────────────────────────────────────────
  const productsToSeed: Array<{
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
    featured?: boolean;
  }> = [
    {
      title: 'Camiseta Hombre Essential',
      description: 'Camiseta premium para hombre, ideal para uso diario.',
      slug: 'camiseta-hombre-essential',
      sku: 'CAM-H-ESS-001',
      price: 89.9,
      comparePrice: 119.9,
      inStock: 40,
      sizes: [Size.S, Size.M, Size.L, Size.XL],
      gender: Gender.men,
      tags: ['hombre', 'casual', 'algodon'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'camisetas',
      featured: true
    },
    {
      title: 'Hoodie Hombre Urban',
      description: 'Hoodie de corte urbano para clima fresco.',
      slug: 'hoodie-hombre-urban',
      sku: 'HOO-H-URB-001',
      price: 149.9,
      inStock: 25,
      sizes: [Size.M, Size.L, Size.XL],
      gender: Gender.men,
      tags: ['hombre', 'hoodie', 'urbano'],
      images: ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'],
      categorySlug: 'hoodies'
    },
    {
      title: 'Jogger Hombre Sport',
      description: 'Jogger cómodo con ajuste moderno.',
      slug: 'jogger-hombre-sport',
      sku: 'JOG-H-SPO-001',
      price: 119.9,
      inStock: 30,
      sizes: [Size.S, Size.M, Size.L],
      gender: Gender.men,
      tags: ['hombre', 'sport', 'jogger'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'pantalones'
    },
    {
      title: 'Blusa Mujer Minimal',
      description: 'Blusa versátil para looks casuales y elegantes.',
      slug: 'blusa-mujer-minimal',
      sku: 'BLU-M-MIN-001',
      price: 99.9,
      comparePrice: 129.9,
      inStock: 36,
      sizes: [Size.XS, Size.S, Size.M, Size.L],
      gender: Gender.women,
      tags: ['mujer', 'blusa', 'minimal'],
      images: ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'],
      categorySlug: 'camisetas',
      featured: true
    },
    {
      title: 'Vestido Mujer Breeze',
      description: 'Vestido ligero perfecto para clima cálido.',
      slug: 'vestido-mujer-breeze',
      sku: 'VES-M-BRE-001',
      price: 159.9,
      inStock: 20,
      sizes: [Size.S, Size.M, Size.L],
      gender: Gender.women,
      tags: ['mujer', 'vestido', 'verano'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'vestidos'
    },
    {
      title: 'Chaqueta Mujer Denim',
      description: 'Chaqueta denim atemporal para cualquier temporada.',
      slug: 'chaqueta-mujer-denim',
      sku: 'CHA-M-DEN-001',
      price: 189.9,
      inStock: 18,
      sizes: [Size.S, Size.M, Size.L, Size.XL],
      gender: Gender.women,
      tags: ['mujer', 'denim', 'chaqueta'],
      images: ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'],
      categorySlug: 'chaquetas'
    },
    {
      title: 'Camiseta Niño Fun',
      description: 'Camiseta cómoda y resistente para niños.',
      slug: 'camiseta-nino-fun',
      sku: 'CAM-N-FUN-001',
      price: 69.9,
      inStock: 35,
      sizes: [Size.XS, Size.S, Size.M],
      gender: Gender.kid,
      tags: ['nino', 'camiseta', 'kids'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'camisetas'
    },
    {
      title: 'Sudadera Niño Active',
      description: 'Sudadera suave para actividades diarias.',
      slug: 'sudadera-nino-active',
      sku: 'SUD-N-ACT-001',
      price: 99.9,
      inStock: 22,
      sizes: [Size.S, Size.M, Size.L],
      gender: Gender.kid,
      tags: ['nino', 'sudadera', 'active'],
      images: ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'],
      categorySlug: 'hoodies'
    },
    {
      title: 'Pantalón Niño Play',
      description: 'Pantalón flexible para máxima movilidad.',
      slug: 'pantalon-nino-play',
      sku: 'PAN-N-PLY-001',
      price: 84.9,
      inStock: 28,
      sizes: [Size.S, Size.M, Size.L],
      gender: Gender.kid,
      tags: ['nino', 'pantalon', 'play'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'pantalones'
    },
    {
      title: 'Colección Eclipse',
      description: 'Edición nueva de temporada con diseño exclusivo.',
      slug: 'coleccion-eclipse',
      sku: 'COL-U-ECL-001',
      price: 199.9,
      comparePrice: 249.9,
      inStock: 15,
      sizes: [Size.S, Size.M, Size.L, Size.XL],
      gender: Gender.unisex,
      tags: ['nuevo', 'edicion', 'unisex'],
      images: ['/img/shirt/shirt-black-2.png', '/img/shirt/shirt-black-1.png'],
      categorySlug: 'camisetas',
      featured: true
    },
    {
      title: 'Colección Nova',
      description: 'Prenda destacada de la nueva colección.',
      slug: 'coleccion-nova',
      sku: 'COL-U-NOV-001',
      price: 179.9,
      inStock: 0,
      sizes: [Size.S, Size.M, Size.L],
      gender: Gender.unisex,
      tags: ['nuevo', 'coleccion', 'trend'],
      images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
      categorySlug: 'camisetas'
    }
  ];

  for (const productData of productsToSeed) {
    const catId = categoryMap.get(productData.categorySlug);
    if (!catId) continue;

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
        tags: productData.tags.map((tag) => tag.toLowerCase()),
        gender: productData.gender,
        categoryId: catId,
        featured: productData.featured ?? false
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
        tags: productData.tags.map((tag) => tag.toLowerCase()),
        gender: productData.gender,
        categoryId: catId,
        featured: productData.featured ?? false
      }
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: productData.images.map((url, i) => ({
        url,
        productId: product.id,
        sortOrder: i
      }))
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────
  const users = [
    { email: 'superadmin@nexstore.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
    { email: 'admin@nexstore.com', name: 'Admin', role: Role.ADMIN },
    { email: 'manager@nexstore.com', name: 'Manager', role: Role.MANAGER },
    { email: 'support@nexstore.com', name: 'Support', role: Role.SUPPORT },
    { email: 'cliente@nexstore.com', name: 'Cliente Demo', role: Role.USER },
    { email: 'maria@nexstore.com', name: 'María García', role: Role.USER },
    { email: 'carlos@nexstore.com', name: 'Carlos López', role: Role.USER }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: bcryptjs.hashSync('Qwert.12345', 10), role: u.role },
      create: {
        email: u.email,
        name: u.name,
        password: bcryptjs.hashSync('Qwert.12345', 10),
        role: u.role
      }
    });
  }

  // ── Demo Orders ───────────────────────────────────────────────────────
  const clientUser = await prisma.user.findUnique({ where: { email: 'cliente@nexstore.com' } });
  const mariaUser = await prisma.user.findUnique({ where: { email: 'maria@nexstore.com' } });
  const products = await prisma.product.findMany({ take: 4 });

  if (clientUser && products.length >= 2) {
    const existingOrders = await prisma.order.count({ where: { userId: clientUser.id } });
    if (existingOrders === 0) {
      await prisma.order.create({
        data: {
          userId: clientUser.id,
          subTotal: 239.8,
          tax: 35.97,
          total: 275.77,
          itemsInOrder: 2,
          isPaid: true,
          paidAt: new Date(Date.now() - 5 * 86_400_000),
          status: OrderStatus.DELIVERED,
          paymentStatus: 'PAID',
          OrderItem: {
            create: [
              { productId: products[0].id, quantity: 1, price: products[0].price, size: Size.M },
              { productId: products[1].id, quantity: 1, price: products[1].price, size: Size.L }
            ]
          },
          OrderAddress: {
            create: {
              firstName: 'Cliente',
              lastName: 'Demo',
              address: 'Calle 123 #45-67',
              postalCode: '110111',
              city: 'Bogotá',
              phone: '+573001234567',
              countryId: 'CO'
            }
          }
        }
      });

      await prisma.order.create({
        data: {
          userId: clientUser.id,
          subTotal: 89.9,
          tax: 13.49,
          total: 103.39,
          itemsInOrder: 1,
          status: OrderStatus.PENDING,
          paymentStatus: 'PENDING',
          OrderItem: {
            create: [
              { productId: products[0].id, quantity: 1, price: products[0].price, size: Size.S }
            ]
          },
          OrderAddress: {
            create: {
              firstName: 'Cliente',
              lastName: 'Demo',
              address: 'Calle 123 #45-67',
              postalCode: '110111',
              city: 'Bogotá',
              phone: '+573001234567',
              countryId: 'CO'
            }
          }
        }
      });
    }
  }

  if (mariaUser && products.length >= 4) {
    const existingOrders = await prisma.order.count({ where: { userId: mariaUser.id } });
    if (existingOrders === 0) {
      await prisma.order.create({
        data: {
          userId: mariaUser.id,
          subTotal: 349.7,
          tax: 52.46,
          total: 402.16,
          itemsInOrder: 3,
          isPaid: true,
          paidAt: new Date(Date.now() - 2 * 86_400_000),
          status: OrderStatus.PROCESSING,
          paymentStatus: 'PAID',
          OrderItem: {
            create: [
              { productId: products[2].id, quantity: 2, price: products[2].price, size: Size.M },
              { productId: products[3].id, quantity: 1, price: products[3].price, size: Size.S }
            ]
          },
          OrderAddress: {
            create: {
              firstName: 'María',
              lastName: 'García',
              address: 'Av. Reforma 222',
              postalCode: '06600',
              city: 'CDMX',
              phone: '+525512345678',
              countryId: 'MX'
            }
          }
        }
      });
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
