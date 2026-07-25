import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';

describe('Session Management Routes', () => {
    const userEmail = `session_route_${Date.now()}@example.com`;
    const password = 'GroceNest-Secure-Pass-2026!';
    let token: string;
    let userId: string;

    beforeAll(async () => {
        const registerRes = await request(app)
            .post('/api/auth/register')
            .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
            .send({
                email: userEmail,
                password,
                firstName: 'SessionRoute',
                lastName: 'Tester',
            });

        expect(registerRes.status).toBe(201);
        token = registerRes.body.token;
        userId = registerRes.body.user.id;
    });

    afterAll(async () => {
        if (userId) {
            await prisma.userSession.deleteMany({ where: { userId } }).catch(() => {});
            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        }
    });

    it('should reject unauthenticated request to GET /api/auth/sessions with 401', async () => {
        const res = await request(app).get('/api/auth/sessions');
        expect(res.status).toBe(401);
    });

    it('should return active sessions for logged in user via GET /api/auth/sessions', async () => {
        const res = await request(app)
            .get('/api/auth/sessions')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.sessions).toBeDefined();
        expect(Array.isArray(res.body.sessions)).toBe(true);
        expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);

        const session = res.body.sessions[0];
        expect(session.id).toBeDefined();
        expect(session.deviceType).toBe('desktop');
        expect(session.isActive).toBe(true);
    });

    it('should create additional session on login and list both sessions', async () => {
        const loginRes = await request(app)
            .post('/api/auth/login')
            .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')
            .send({
                email: userEmail,
                password,
            });

        expect(loginRes.status).toBe(200);

        const sessionsRes = await request(app)
            .get('/api/auth/sessions')
            .set('Authorization', `Bearer ${token}`);

        expect(sessionsRes.status).toBe(200);
        expect(sessionsRes.body.sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should revoke a specific session via DELETE /api/auth/sessions/:sessionId', async () => {
        const sessionsRes = await request(app)
            .get('/api/auth/sessions')
            .set('Authorization', `Bearer ${token}`);

        const sessions = sessionsRes.body.sessions;
        expect(sessions.length).toBeGreaterThanOrEqual(2);

        const sessionToRevoke = sessions[sessions.length - 1];

        const revokeRes = await request(app)
            .delete(`/api/auth/sessions/${sessionToRevoke.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(revokeRes.status).toBe(200);
        expect(revokeRes.body.message).toContain('Session revoked successfully');

        const verifyRes = await request(app)
            .get('/api/auth/sessions')
            .set('Authorization', `Bearer ${token}`);

        const found = verifyRes.body.sessions.find((s: any) => s.id === sessionToRevoke.id);
        expect(found).toBeUndefined();
    });

    it('should revoke other sessions via POST /api/auth/sessions/revoke-others', async () => {
        // Create an additional session first
        await request(app)
            .post('/api/auth/login')
            .set('User-Agent', 'Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X)')
            .send({
                email: userEmail,
                password,
            });

        const revokeOthersRes = await request(app)
            .post('/api/auth/sessions/revoke-others')
            .set('Authorization', `Bearer ${token}`);

        expect(revokeOthersRes.status).toBe(200);
        expect(revokeOthersRes.body.revokedCount).toBeDefined();
    });
});
