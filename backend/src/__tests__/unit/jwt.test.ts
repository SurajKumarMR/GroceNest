import { signToken, verifyToken, signRefreshToken } from '../../utils/jwt.utils';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-12345' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should sign an access token and verify it successfully', () => {
    const payload = { userId: 'user-123', role: 'CUSTOMER' };
    const token = signToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token, 'access');
    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe('user-123');
    expect(decoded.role).toBe('CUSTOMER');
    expect(decoded.type).toBe('access');
  });

  it('should return null when verifying a token with type mismatch', () => {
    const payload = { userId: 'user-123' };
    const token = signToken(payload); // type is 'access'

    const decoded = verifyToken(token, 'refresh');
    expect(decoded).toBeNull();
  });

  it('should return null for malformed or invalid tokens', () => {
    expect(verifyToken('invalid.jwt.token')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('should sign and verify refresh token', () => {
    const payload = { userId: 'user-456' };
    const refreshToken = signRefreshToken(payload);

    expect(refreshToken).toBeDefined();
    const decoded = verifyToken(refreshToken, 'refresh');

    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe('user-456');
    expect(decoded.type).toBe('refresh');
    expect(decoded.jti).toBeDefined();
  });

  it('should throw error in signToken when no secret or private key is provided in non-prod', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_PRIVATE_KEY;

    jest.isolateModules(() => {
      const { signToken: isolatedSignToken } = require('../../utils/jwt.utils');
      expect(() => isolatedSignToken({ userId: '123' })).toThrow('No JWT signing key provided');
    });
  });
});
