import { config } from 'dotenv';
import { resolve } from 'node:path';
import bcryptjs from 'bcryptjs';
import { Gender, OrderStatus, PrismaClient, Role, Size } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/infrastructure/prisma/prisma-client-options';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../src/shared/infrastructure/auth/permissions';
import { seedCatalog } from './seed-catalog';

// Monorepo: allow `npm run prisma:seed -w back` with `.env` at repo root.
config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const prisma = new PrismaClient(createPrismaClientOptions());

async function main() {
  console.log('Seeding database...');

  // ── RBAC permissions ───────────────────────────────────────────────────
  const permissionDescriptions: Record<string, string> = {
    [PERMISSIONS.DASHBOARD_READ]: 'Read admin dashboard and analytics overview',
    [PERMISSIONS.USERS_READ]: 'Read customer and user records',
    [PERMISSIONS.USERS_MANAGE]: 'Create, update, deactivate and assign user roles',
    [PERMISSIONS.ORDERS_READ]: 'Read order records and order details',
    [PERMISSIONS.ORDERS_UPDATE]: 'Update order status and internal order notes',
    [PERMISSIONS.ORDERS_CANCEL]: 'Cancel active orders',
    [PERMISSIONS.PRODUCTS_READ]: 'Read product records',
    [PERMISSIONS.PRODUCTS_CREATE]: 'Create products',
    [PERMISSIONS.PRODUCTS_UPDATE]: 'Update products and media',
    [PERMISSIONS.PRODUCTS_DELETE]: 'Delete products',
    [PERMISSIONS.CATEGORIES_READ]: 'Read categories',
    [PERMISSIONS.CATEGORIES_CREATE]: 'Create categories',
    [PERMISSIONS.CATEGORIES_UPDATE]: 'Update categories',
    [PERMISSIONS.CATEGORIES_DELETE]: 'Delete categories',
    [PERMISSIONS.INVENTORY_READ]: 'Read inventory status',
    [PERMISSIONS.INVENTORY_ADJUST]: 'Adjust inventory levels',
    [PERMISSIONS.PROMOTIONS_MANAGE]: 'Create and manage promotions',
    [PERMISSIONS.PAYMENTS_READ]: 'Read and update payment status',
    [PERMISSIONS.AUDIT_READ]: 'Read security and audit logs',
    [PERMISSIONS.SETTINGS_MANAGE]: 'Manage critical system settings',
  };

  for (const permissionId of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { id: permissionId },
      update: { description: permissionDescriptions[permissionId] },
      create: {
        id: permissionId,
        description: permissionDescriptions[permissionId],
      },
    });
  }

  await prisma.rolePermission.deleteMany();
  await prisma.rolePermission.createMany({
    data: Object.entries(ROLE_PERMISSIONS).flatMap(([role, permissions]) =>
      permissions.map((permissionId) => ({ role: role as Role, permissionId })),
    ),
    skipDuplicates: true,
  });

  // ── Countries ─────────────────────────────────────────────────────────
  const countries = [
    { id: 'CO', name: 'Colombia', isoCode: 'CO', currency: 'COP', priority: 10 },
    { id: 'MX', name: 'México', isoCode: 'MX', currency: 'MXN', priority: 9 },
    { id: 'AR', name: 'Argentina', isoCode: 'AR', currency: 'ARS', priority: 8 },
    { id: 'CL', name: 'Chile', isoCode: 'CL', currency: 'CLP', priority: 7 },
    { id: 'PE', name: 'Perú', isoCode: 'PE', currency: 'PEN', priority: 6 },
    { id: 'US', name: 'United States', isoCode: 'US', currency: 'USD', priority: 5 },
    { id: 'ES', name: 'España', isoCode: 'ES', currency: 'EUR', priority: 4 },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: { name: country.name, isoCode: country.isoCode, currency: country.currency, priority: country.priority },
      create: country,
    });
  }

  // ── Categories ────────────────────────────────────────────────────────
  const categoriesData = [
    { name: 'Camisetas', slug: 'camisetas', description: 'Camisetas para toda ocasión', sortOrder: 1 },
    { name: 'Hoodies', slug: 'hoodies', description: 'Sudaderas y hoodies', sortOrder: 2 },
    { name: 'Pantalones', slug: 'pantalones', description: 'Pantalones y joggers', sortOrder: 3 },
    { name: 'Vestidos', slug: 'vestidos', description: 'Vestidos para mujer', sortOrder: 4 },
    { name: 'Chaquetas', slug: 'chaquetas', description: 'Chaquetas y abrigos', sortOrder: 5 },
    { name: 'Accesorios', slug: 'accesorios', description: 'Gorras, bolsos y más', sortOrder: 6 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, category.id);
  }

  // ── Products ──────────────────────────────────────────────────────────
  // NOTE: Products are now seeded from seed-catalog.ts with R2 images
  // The old local image products have been removed to ensure all images
  // are served from Cloudflare R2.
  console.log('Skipping legacy products in seed.ts - using seed-catalog.ts instead');

  // ── Users ─────────────────────────────────────────────────────────────
  const users = [
    { email: 'superadmin@nexstore.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
    { email: 'admin@nexstore.com', name: 'Admin', role: Role.ADMIN },
    { email: 'manager@nexstore.com', name: 'Manager', role: Role.MANAGER },
    { email: 'support@nexstore.com', name: 'Support', role: Role.SUPPORT },
    { email: 'cliente@nexstore.com', name: 'Cliente Demo', role: Role.CUSTOMER },
    { email: 'maria@nexstore.com', name: 'María García', role: Role.CUSTOMER },
    { email: 'carlos@nexstore.com', name: 'Carlos López', role: Role.CUSTOMER },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: bcryptjs.hashSync('Qwert.12345', 10),
        role: u.role,
        emailVerified: new Date(),
        mfaEnabled: false,
        mfaSecret: null,
      },
      create: {
        email: u.email,
        name: u.name,
        password: bcryptjs.hashSync('Qwert.12345', 10),
        role: u.role,
        emailVerified: new Date(),
        mfaEnabled: false,
      },
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
              { productId: products[1].id, quantity: 1, price: products[1].price, size: Size.L },
            ],
          },
          OrderAddress: {
            create: {
              firstName: 'Cliente',
              lastName: 'Demo',
              address: 'Calle 123 #45-67',
              postalCode: '110111',
              city: 'Bogotá',
              phone: '+573001234567',
              countryId: 'CO',
            },
          },
        },
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
            create: [{ productId: products[0].id, quantity: 1, price: products[0].price, size: Size.S }],
          },
          OrderAddress: {
            create: {
              firstName: 'Cliente',
              lastName: 'Demo',
              address: 'Calle 123 #45-67',
              postalCode: '110111',
              city: 'Bogotá',
              phone: '+573001234567',
              countryId: 'CO',
            },
          },
        },
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
              { productId: products[3].id, quantity: 1, price: products[3].price, size: Size.S },
            ],
          },
          OrderAddress: {
            create: {
              firstName: 'María',
              lastName: 'García',
              address: 'Av. Reforma 222',
              postalCode: '06600',
              city: 'CDMX',
              phone: '+525512345678',
              countryId: 'MX',
            },
          },
        },
      });
    }
  }

  // ── Home Banners ─────────────────────────────────────────────────────
  // Using images from R2 bucket
  const storageProvider = 'r2';
  const baseUrl = process.env.STORAGE_PUBLIC_URL || '';

  if (!baseUrl) {
    console.warn('STORAGE_PUBLIC_URL not set, skipping banner image URLs');
  }

  const homeBanners = [
    {
      title: 'Tu outfit soñado, ahora con oferta',
      subtitle: 'Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!',
      ctaText: 'Ropa de mujer',
      ctaLink: '/women',
      secondaryText: 'Accesorios',
      secondaryLink: '/accessories',
      imageUrl: 'home/slider/slider-1.webp',
      storageKey: 'home/slider/slider-1.webp',
      storageProvider,
      altText: 'Slider 1 - Outfit con oferta',
      sortOrder: 0,
      isActive: true,
    },
    {
      title: 'El look que deseas, al mejor precio',
      subtitle: 'Encuentra las tendencias más exclusivas con descuentos irresistibles. ¡Solo por tiempo limitado!',
      ctaText: 'Conocer outfits',
      ctaLink: '/collections',
      secondaryText: null,
      secondaryLink: null,
      imageUrl: 'home/slider/slider-2.webp',
      storageKey: 'home/slider/slider-2.webp',
      storageProvider,
      altText: 'Slider 2 - Tendencias exclusivas',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'La moda que te define, a precios que te encantan',
      subtitle: 'Descubre colecciones diseñadas para expresar tu estilo único sin gastar de más.',
      ctaText: 'Ver colección',
      ctaLink: '/new-arrivals',
      secondaryText: null,
      secondaryLink: null,
      imageUrl: 'home/slider/slider-3.webp',
      storageKey: 'home/slider/slider-3.webp',
      storageProvider,
      altText: 'Slider 3 - Colección nueva',
      sortOrder: 2,
      isActive: true,
    },
  ];

  // Clear existing banners and create new ones
  await prisma.homeBanner.deleteMany();
  for (const banner of homeBanners) {
    await prisma.homeBanner.create({ data: banner });
  }
  console.log(`Seeded ${homeBanners.length} home banners`);

  // Se habilitan los productos despues de actualizar el bucket de r2 a las variables de entorno
  await seedCatalog(prisma);
  // ── Default Warehouse & Inventory ───────────────────────────────────
  console.log('Setting up warehouse and inventory...');

  const defaultWarehouseId = process.env.DEFAULT_WAREHOUSE_ID || 'wh-default-001';

  // Create default warehouse if it doesn't exist
  await prisma.warehouse.upsert({
    where: { id: defaultWarehouseId },
    update: {},
    create: {
      id: defaultWarehouseId,
      name: 'Sucursal Principal',
      code: 'MAIN',
      location: 'Ubicación Principal',
      isActive: true,
    },
  });
  console.log(`Default warehouse ready: ${defaultWarehouseId}`);

  // Create inventory records for products that don't have one
  const productsWithoutInventory = await prisma.product.findMany({
    where: {
      deletedAt: null,
      inventories: { none: {} },
    },
    select: { id: true, inStock: true },
  });

  if (productsWithoutInventory.length > 0) {
    await prisma.inventory.createMany({
      data: productsWithoutInventory.map((p) => ({
        productId: p.id,
        warehouseId: defaultWarehouseId,
        availableQuantity: p.inStock,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        allowNegativeStock: false,
      })),
      skipDuplicates: true,
    });
    console.log(`Created ${productsWithoutInventory.length} inventory records`);
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
