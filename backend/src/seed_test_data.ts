import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing database...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();

    console.log('Seeding database...');

    // 1. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@grocenest.com',
            firstName: 'Admin',
            lastName: 'User',
            passwordHash,
            role: 'ADMIN',
        },
    });

    const merchantUser = await prisma.user.create({
        data: {
            email: 'merchant@grocenest.com',
            firstName: 'Global',
            lastName: 'Merchant',
            passwordHash,
            role: 'MERCHANT',
        },
    });

    const customerUser = await prisma.user.create({
        data: {
            email: 'customer@grocenest.com',
            firstName: 'John',
            lastName: 'Doe',
            passwordHash,
            role: 'CUSTOMER',
        },
    });

    const driverUser = await prisma.user.create({
        data: {
            email: 'driver@grocenest.com',
            firstName: 'Fast',
            lastName: 'Driver',
            passwordHash,
            role: 'DRIVER',
        },
    });

    console.log('Users created.');

    // 2. Create Stores
    const store1 = await prisma.store.create({
        data: {
            name: 'Tropical Delights',
            slug: 'tropical-delights',
            description: 'Exotic fruits and vegetables from around the world.',
            ownerId: merchantUser.id,
            cuisineTypes: ['Caribbean', 'African'],
            streetAddress: '123 Tropical Way',
            city: 'London',
            postalCode: 'E1 6AN',
            country: 'UK',
            latitude: 51.52,
            longitude: -0.07,
            isActive: true,
        },
    });

    const store2 = await prisma.store.create({
        data: {
            name: 'European Pantry',
            slug: 'european-pantry',
            description: 'Your favorite European groceries.',
            ownerId: merchantUser.id,
            cuisineTypes: ['European', 'Polish'],
            streetAddress: '456 Pantry Road',
            city: 'London',
            postalCode: 'W1 2BC',
            country: 'UK',
            latitude: 51.51,
            longitude: -0.14,
            isActive: true,
        },
    });

    console.log('Stores created.');

    // 3. Create Products
    const products = [
        {
            name: 'Fresh Ackee',
            slug: 'fresh-ackee',
            regularPrice: 5.99,
            storeId: store1.id,
            description: 'Canned or fresh ackee for your saltfish.',
        },
        {
            name: 'Dried Methi (Fenugreek Leaves)',
            slug: 'dried-methi',
            regularPrice: 2.50,
            storeId: store1.id,
            description: 'Essential for Indian curries.',
        },
        {
            name: 'Potato Pierogi',
            slug: 'potato-pierogi',
            regularPrice: 4.50,
            storeId: store2.id,
            description: 'Classic Polish dumplings.',
        },
        {
            name: 'Whole Milk',
            slug: 'whole-milk',
            regularPrice: 1.20,
            storeId: store2.id,
            description: 'Fresh whole milk.',
        }
    ];

    for (const p of products) {
        await prisma.product.create({
            data: p,
        });
    }

    console.log('Products created.');
    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
