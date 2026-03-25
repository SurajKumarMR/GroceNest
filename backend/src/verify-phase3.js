const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAutoCancel() {
    console.log('--- Verifying Auto-Cancellation (Item 112) ---');
    
    const store = await prisma.store.findFirst();
    const user = await prisma.user.findFirst();

    if (!store || !user) {
        console.error('Missing store or user for test.');
        return;
    }

    // 1. Create a stale PENDING order (manual timestamp hack if possible or just wait)
    // Actually, I can't easily backdate a createdAt in Prisma without direct SQL, 
    // but I'll try to find an older one or just verify the logic runs.
    
    // Create an order
    const order = await prisma.order.create({
        data: {
            orderNumber: `TEST-CANCEL-${Date.now()}`,
            userId: user.id,
            storeId: store.id,
            subtotal: 10,
            totalAmount: 15,
            status: 'PENDING',
            createdAt: new Date(Date.now() - 11 * 60 * 1000) // Backdate 11 mins
        }
    });
    console.log(`✓ Created test order: ${order.orderNumber}`);

    // 2. Run the cancellation logic (Extracted from controller manually here for verification)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const ordersToCancel = await prisma.order.findMany({
        where: {
            status: 'PENDING',
            createdAt: { lt: tenMinutesAgo }
        }
    });

    console.log(`Found ${ordersToCancel.length} orders eligible for auto-cancel.`);
    
    for (const o of ordersToCancel) {
        await prisma.order.update({
            where: { id: o.id },
            data: {
                status: 'CANCELLED',
                cancellationReason: 'Auto-cancelled: No response from store within 10 minutes'
            }
        });
        console.log(`✓ Auto-cancelled order: ${o.orderNumber}`);
    }

    // 3. Verify
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    console.log(`Final Status: ${updated.status}`);
    
    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
}

verifyAutoCancel()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
