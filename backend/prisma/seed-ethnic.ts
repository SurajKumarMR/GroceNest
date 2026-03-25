import prisma from '../src/utils/prisma';

async function seed() {
  console.log('Seeding ethnic items for Item 101...');
  
  const store = await prisma.store.findFirst();
  if (!store) {
    console.error('No store found to attach items to. Run global seed first.');
    return;
  }

  const items = [
    { name: 'Canned Ackee', slug: 'canned-ackee', description: 'Traditional Jamaican ackee in brine.', regularPrice: 4.50, stockQuantity: 20, storeId: store.id, status: 'active' },
    { name: 'Fresh Methi (Fenugreek)', slug: 'fresh-methi', description: 'Fresh green methi leaves for curries.', regularPrice: 1.20, stockQuantity: 50, storeId: store.id, status: 'active' },
    { name: 'Potato & Cheese Pierogi', slug: 'potato-cheese-pierogi', description: 'Handmade Polish dumplings with potato and cheese filling.', regularPrice: 3.99, stockQuantity: 15, storeId: store.id, status: 'active' },
  ];

  for (const item of items) {
    await prisma.product.upsert({
      where: { id: `ethnic-${items.indexOf(item)}` }, // Mock ID
      update: {},
      create: {
        ...item,
        id: undefined // Let prisma generate it or use specific IDs
      }
    });
  }

  console.log('Seeding complete.');
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
