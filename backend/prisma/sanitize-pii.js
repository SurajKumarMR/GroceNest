const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sanitize() {
    console.log('--- Cleaning PII from Database (GDPR Compliance) ---');
    
    const users = await prisma.user.findMany();
    let sanitizedCount = 0;

    for (const user of users) {
        // Obfuscate email and phone
        const sanitizedEmail = `user_${user.id.substring(0, 8)}@example.com`;
        const sanitizedPhone = `+44${user.id.substring(0, 10).replace(/[^0-9]/g, '0').padEnd(10, '0')}`;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: sanitizedEmail,
                phone: sanitizedPhone,
                firstName: 'Sanitized',
                lastName: 'User'
            }
        });
        sanitizedCount++;
    }

    console.log(`✓ Sanitized ${sanitizedCount} users.`);
}

sanitize()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
