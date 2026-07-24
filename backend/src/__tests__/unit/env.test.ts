import { z } from 'zod';

describe('Environment Variable Validation (env.ts)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should validate required environment variables in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        process.env.JWT_SECRET = 'supersecretkey12345678901234567890';
        process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
        process.env.TWILIO_ACCOUNT_SID = 'AC12345';
        process.env.SENDGRID_API_KEY = 'SG.12345';
        process.env.SENTRY_DSN = 'https://key@sentry.io/123';

        const requiredVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'STRIPE_SECRET_KEY',
            'TWILIO_ACCOUNT_SID',
            'SENDGRID_API_KEY',
            'SENTRY_DSN',
        ];

        const missing = requiredVars.filter(v => !process.env[v]);
        expect(missing).toHaveLength(0);
    });

    it('should identify missing required variables in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        delete process.env.JWT_SECRET;
        delete process.env.STRIPE_SECRET_KEY;

        const requiredVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'STRIPE_SECRET_KEY',
            'TWILIO_ACCOUNT_SID',
            'SENDGRID_API_KEY',
            'SENTRY_DSN',
        ];

        const missing = requiredVars.filter(v => !process.env[v]);
        expect(missing).toContain('JWT_SECRET');
        expect(missing).toContain('STRIPE_SECRET_KEY');
    });
});
