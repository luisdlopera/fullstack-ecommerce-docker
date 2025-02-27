import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Crear categorías
    const category = await prisma.category.create({
        data: {
            name: 'Ropa',
        },
    });

    // Crear productos
    const product = await prisma.product.create({
        data: {
            title: 'Camiseta básica',
            description: 'Camiseta de algodón 100%',
            inStock: 100,
            price: 19.99,
            sizes: ['M', 'L'],
            slug: 'camiseta-basica',
            tags: ['algodón', 'básico'],
            gender: 'unisex',
            categoryId: category.id,
            ProductImage: {
                create: [
                    { url: 'https://example.com/image1.jpg' },
                    { url: 'https://example.com/image2.jpg' },
                ],
            },
        },
    });

    // Crear usuarios
    const user = await prisma.user.createMany({
        data: [
            {
                email: 'user@nexstore.com',
                name: 'nexstore',
                password: bcryptjs.hashSync('Qwert.12345'),
                role: 'admin'
            },
            {
                email: 'luis@gmail.com',
                name: 'luis david lopera',
                password: bcryptjs.hashSync('Qwert.12345'),
                role: 'user'
            },
        ]
    });

    // Crear país
    const country = await prisma.country.create({
        data: {
            id: 'COL',
            name: 'Colombia',
        },
    });

    // Crear dirección de usuario (UserAddress) para Luis
    const userAddress = await prisma.userAddress.create({
        data: {
            firstName: 'Luis',
            lastName: 'Lopera',
            address: 'Calle 123',
            address2: 'Apartamento 4',
            postalCode: '11001',
            phone: '555-1234',
            city: 'Bogotá',
            countryId: country.id,
            userId: userLuis.id,
        },
    });

    // Crear una orden (Order) para Luis, con un item y dirección de orden (OrderAddress)
    const order = await prisma.order.create({
        data: {
            subTotal: 19.99,
            tax: 0.2,
            total: 20.19,
            itemsInOrder: 1,
            isPaid: true,
            paidAt: new Date(),
            userId: userLuis.id,
            transactionId: 'TX123456',
            OrderItem: {
                create: [
                    {
                        quantity: 1,
                        price: 19.99,
                        size: 'M', // Debe coincidir con los valores del enum Size
                        productId: product.id,
                    },
                ],
            },
            OrderAddress: {
                create: {
                    firstName: 'Luis',
                    lastName: 'Lopera',
                    address: 'Calle Order 123',
                    address2: 'Departamento 1',
                    postalCode: '11001',
                    city: 'Bogotá',
                    phone: '555-6789',
                    countryId: country.id,
                },
            },
        },
    });

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
