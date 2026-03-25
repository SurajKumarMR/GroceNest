import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const storeCount = await prisma.store.count();
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();

    console.log(`Stores: ${storeCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Users: ${userCount}`);

    const specificProducts = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: 'ackee' } },
                { name: { contains: 'methi' } },
                { name: { contains: 'pierogi' } }
            ]
        },
        select: { name: true, store: { select: { name: true } } }
    });

    console.log('Specific products found:', specificProducts);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
