import request from 'supertest';
import logger from '../../utils/logger';

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKSECRET123',
    generateURI: () => 'mock-uri',
    verify: () => true
}));

import { app } from '../../index';

describe('Request/Response Logging Middleware (index.ts)', () => {
    let loggerSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerSpy = jest.spyOn(logger, 'http').mockImplementation(() => logger);
    });

    afterEach(() => {
        loggerSpy.mockRestore();
    });

    it('should log HTTP request metadata and mask sensitive fields in request body', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'SensitivePassword123!',
                token: 'secret-auth-token'
            });

        expect(loggerSpy).toHaveBeenCalled();
        const loggedString = loggerSpy.mock.calls[0][0];
        const logObject = JSON.parse(loggedString);

        expect(logObject).toHaveProperty('method', 'POST');
        expect(logObject).toHaveProperty('url', '/api/auth/login');
        expect(logObject).toHaveProperty('status');
        expect(logObject).toHaveProperty('duration');
        expect(logObject).toHaveProperty('timestamp');

        // Check PII masking
        if (logObject.body) {
            expect(logObject.body.password).toBe('********');
            expect(logObject.body.token).toBe('********');
            expect(logObject.body.email).toBe('test@example.com');
        }
    });
});
