
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
    if (params.model === 'User' && params.action === 'create') {
        const data = params.args.data;
        if (!data.passwordHash && !data.googleId && !data.appleId) {
            throw new Error('User must have password or social login');
        }
    }
    return next(params);
});

export default prisma;
