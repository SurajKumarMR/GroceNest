jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: () => 'KVKFKRJTMR2HSKSK',
        check: () => true,
        keyuri: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
    }
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

import request from 'supertest';
import { app } from '../../index';
import { formatPooledDbUrl, getDbConnectionPoolMetrics } from '../../utils/prisma';

describe('Database Connection Pooling Unit Tests', () => {
    it('formatPooledDbUrl appends connection_limit and pool_timeout parameters', () => {
        const rawUrl = 'postgresql://postgres:password@localhost:5432/testdb?schema=public';
        const pooledUrl = formatPooledDbUrl(rawUrl);

        expect(pooledUrl).toContain('connection_limit=20');
        expect(pooledUrl).toContain('pool_timeout=10');
    });

    it('formatPooledDbUrl respects existing connection_limit if provided', () => {
        const rawUrl = 'postgresql://postgres:password@localhost:5432/testdb?schema=public&connection_limit=50';
        const pooledUrl = formatPooledDbUrl(rawUrl);

        expect(pooledUrl).toContain('connection_limit=50');
        expect(pooledUrl).toContain('pool_timeout=10');
    });

    it('getDbConnectionPoolMetrics returns connection metrics structure', async () => {
        const metrics = await getDbConnectionPoolMetrics();

        expect(metrics).toBeDefined();
        expect(metrics.configuredPoolLimit).toBe(20);
        expect(metrics.configuredTimeoutSeconds).toBe(10);
        expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
        expect(metrics.idleConnections).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/health/db-pool returns connection pool status', async () => {
        const res = await request(app).get('/api/health/db-pool');

        expect([200, 503]).toContain(res.status);
        expect(res.body.configuredPoolLimit).toBe(20);
        expect(res.body.configuredTimeoutSeconds).toBe(10);
    });
});
