import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/infrastructure/prisma/prisma-client-options';
import { seedCatalog } from './seed-catalog';

config({ path: resolve(process.cwd(), '..', '.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient(createPrismaClientOptions());

seedCatalog(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
