import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Formats database URL with connection pooling query parameters
 */
export function formatPooledDbUrl(rawUrl?: string): string {
    const baseUrl = rawUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/grocenest?schema=public';
    const limit = process.env.DATABASE_CONNECTION_LIMIT || process.env.MAX_POOL_SIZE || '20';
    const timeout = process.env.DATABASE_POOL_TIMEOUT || '10';
    const isPgBouncer = process.env.PGBOUNCER === 'true';

    try {
        const urlObj = new URL(baseUrl);
        if (!urlObj.searchParams.has('connection_limit')) {
            urlObj.searchParams.set('connection_limit', limit);
        }
        if (!urlObj.searchParams.has('pool_timeout')) {
            urlObj.searchParams.set('pool_timeout', timeout);
        }
        if (isPgBouncer && !urlObj.searchParams.has('pgbouncer')) {
            urlObj.searchParams.set('pgbouncer', 'true');
        }
        return urlObj.toString();
    } catch {
        return baseUrl;
    }
}

const pooledUrl = formatPooledDbUrl();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: pooledUrl,
        },
    },
});

prisma.$use(async (params, next) => {
    if (params.model === 'User' && params.action === 'create') {
        const data = params.args.data;
        if (!data.passwordHash && !data.googleId && !data.appleId) {
            throw new Error('User must have password or social login');
        }
    }
    return next(params);
});

/**
 * Fetches database connection pool stats from PostgreSQL pg_stat_activity
 */
export async function getDbConnectionPoolMetrics() {
    try {
        const result: any[] = await prisma.$queryRaw`
            SELECT 
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections,
                count(*) as total_connections
            FROM pg_stat_activity 
            WHERE datname = current_database();
        `;
        const stats = result[0] || {};
        return {
            activeConnections: Number(stats.active_connections || 0),
            idleConnections: Number(stats.idle_connections || 0),
            totalConnections: Number(stats.total_connections || 0),
            configuredPoolLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || process.env.MAX_POOL_SIZE || '20', 10),
            configuredTimeoutSeconds: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10),
            pgBouncerEnabled: process.env.PGBOUNCER === 'true',
        };
    } catch (error) {
        return {
            activeConnections: 0,
            idleConnections: 0,
            totalConnections: 0,
            configuredPoolLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || process.env.MAX_POOL_SIZE || '20', 10),
            configuredTimeoutSeconds: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10),
            pgBouncerEnabled: process.env.PGBOUNCER === 'true',
            error: (error as Error).message,
        };
    }
}

export default prisma;
