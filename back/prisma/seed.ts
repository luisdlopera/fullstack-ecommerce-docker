import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const category = await prisma.category.upsert({
    where: { name: 'Ropa' },
    update: {},
    create: { name: 'Ropa' }
  });

  const product = await prisma.product.upsert({
    where: { slug: 'camiseta-basica' },
    update: {
      title: 'Camiseta basica',
      description: 'Camiseta de algodon 100%',
      inStock: 100,
      price: 19.99,
      sizes: ['M', 'L'],
      tags: ['algodon', 'basico'],
      gender: 'unisex',
      categoryId: category.id
    },
    create: {
      title: 'Camiseta basica',
      description: 'Camiseta de algodon 100%',
      inStock: 100,
      price: 19.99,
      sizes: ['M', 'L'],
      slug: 'camiseta-basica',
      tags: ['algodon', 'basico'],
      gender: 'unisex',
      categoryId: category.id
    }
  });

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.createMany({
    data: [
      { url: '/img/shirt/shirt-black-1.png', productId: product.id },
      { url: '/img/shirt/shirt-black-2.png', productId: product.id }
    ]
  });

  await prisma.user.upsert({
    where: { email: 'user@nexstore.com' },
    update: {
      name: 'nexstore',
      password: bcryptjs.hashSync('Qwert.12345', 10),
      role: 'admin'
    },
    create: {
      email: 'user@nexstore.com',
      name: 'nexstore',
      password: bcryptjs.hashSync('Qwert.12345', 10),
      role: 'admin'
    }
  });

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
