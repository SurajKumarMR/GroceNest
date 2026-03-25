const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyRecovery() {
    console.log('--- Verifying Recovery Logic ---');
    const testEmail = 'verify-recovery@test.com';
    
    // 1. Setup
    await prisma.user.upsert({
        where: { email: testEmail },
        update: {},
        create: {
            email: testEmail,
            passwordHash: await hashPassword('old-pass'),
            firstName: 'Verify',
            lastName: 'User'
        }
    });

    // 2. Forgot Password Logic
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);
    
    await prisma.user.update({
        where: { email: testEmail },
        data: {
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
        }
    });
    console.log('✓ Reset token saved');

    // 3. Reset Password Logic
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: resetToken,
            passwordResetExpires: { gt: new Date() }
        }
    });

    if (!user) throw new Error('User not found with token');
    
    const newHash = await hashPassword('new-pass');
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: newHash,
            passwordResetToken: null,
            passwordResetExpires: null
        }
    });
    console.log('✓ Password reset successfully');
    
    // 4. Cleanup
    await prisma.user.delete({ where: { email: testEmail } });
    console.log('✓ Cleanup complete');
}

async function verifySearch() {
    console.log('--- Verifying Search (Item 101) ---');
    const queries = ['ackee', 'methi', 'pierogi'];
    
    for (const q of queries) {
        const results = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { description: { contains: q } }
                ]
            }
        });
        console.log(`Query "${q}": Found ${results.length} items`);
    }
}

async function run() {
    try {
        await verifyRecovery();
        await verifySearch();
    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
