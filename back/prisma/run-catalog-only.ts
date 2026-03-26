import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { seedCatalog } from './seed-catalog';

config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

seedCatalog(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
