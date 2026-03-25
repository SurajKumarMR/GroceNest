import request from 'supertest';
import { app } from '../index';
import prisma from '../utils/prisma';

describe('Password Recovery Flow', () => {
  const testEmail = 'test-recovery@example.com';
  let resetToken: string;

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: testEmail },
      update: {},
      create: {
        email: testEmail,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      }
    });
  });

  it('should generate a reset token and log it', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('sent');

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.passwordResetToken).toBeDefined();
    resetToken = user?.passwordResetToken as string;
  });

  it('should reset the password with a valid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'newsecurepassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('success');

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.passwordResetToken).toBeNull();
  });

  it('should fail with an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid-token',
        newPassword: 'somepassword'
      });

    expect(res.status).toBe(400);
  });
});
