import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/infrastructure/prisma/prisma-client-options';

// Load environment variables
config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient(createPrismaClientOptions());

// Default warehouse ID - uses env var or generates a consistent UUID
const DEFAULT_WAREHOUSE_ID = process.env.DEFAULT_WAREHOUSE_ID || '00000000-0000-0000-0000-000000000001';

async function syncProductsToInventory() {
  console.log('Starting inventory sync...');
  console.log(`Using warehouse ID: ${DEFAULT_WAREHOUSE_ID}`);

  // Check if warehouse exists
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: DEFAULT_WAREHOUSE_ID },
  });

  if (!warehouse) {
    console.log(`Warehouse with id ${DEFAULT_WAREHOUSE_ID} not found`);
    console.log('Creating default warehouse...');
    
    await prisma.warehouse.create({
      data: {
        id: DEFAULT_WAREHOUSE_ID,
        name: 'Default Warehouse',
        code: 'DEFAULT',
        location: 'Main Location',
        isActive: true,
      },
    });
    console.log('Default warehouse created');
  }

  // Get all products without inventory records
  const productsWithoutInventory = await prisma.product.findMany({
    where: {
      deletedAt: null,
      inventories: {
        none: {},
      },
    },
    select: {
      id: true,
      title: true,
      inStock: true,
    },
  });

  console.log(`Found ${productsWithoutInventory.length} products without inventory records`);

  // Create inventory records for each product
  let created = 0;
  for (const product of productsWithoutInventory) {
    try {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: DEFAULT_WAREHOUSE_ID,
          availableQuantity: product.inStock,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          allowNegativeStock: false,
        },
      });
      created++;
      console.log(`Created inventory for: ${product.title} (inStock: ${product.inStock})`);
    } catch (error) {
      console.error(`Failed to create inventory for ${product.title}:`, error);
    }
  }

  console.log(`\nSync complete! Created ${created} inventory records`);
}

syncProductsToInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
