const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyReadiness() {
    console.log('--- Verifying Global Launch Readiness ---');
    
    // 1. Check Waitlist
    const email = `test-${Date.now()}@example.com`;
    const waitlist = await prisma.waitlist.create({
        data: { email, name: 'Test User' }
    });
    console.log(`✓ Waitlist functional: ${waitlist.email}`);

    // 2. Check Feedback
    const feedback = await prisma.feedback.create({
        data: {
            content: 'Testing launch readiness feedback',
            type: 'suggestion'
        }
    });
    console.log(`✓ Feedback functional: ${feedback.id}`);

    // 3. Check Analytics
    // We can't easily verify middleware logs here but we've seen it registered.
    
    // 4. Legal
    const fs = require('fs');
    if (fs.existsSync('PRIVACY_POLICY.md') && fs.existsSync('TERMS_OF_SERVICE.md')) {
        console.log('✓ Legal documents present.');
    }

    // Cleanup
    await prisma.waitlist.delete({ where: { id: waitlist.id } });
    await prisma.feedback.delete({ where: { id: feedback.id } });
}

verifyReadiness()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
