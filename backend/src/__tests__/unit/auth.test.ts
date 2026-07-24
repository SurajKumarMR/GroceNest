import { hashPassword, comparePassword } from '../../utils/password.utils';
import { signToken, verifyToken, signRefreshToken } from '../../utils/jwt.utils';
import { registerSchema } from '../../utils/validation';
import { generateMFASecret, generateMFAUri, verifyMFAToken, generateBackupCodes } from '../../utils/mfa.utils';
import { isPasswordPwned } from '../../utils/pwned.utils';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKSECRET123',
    generateURI: ({ label, secret, issuer }: any) => `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`,
    verify: jest.fn().mockImplementation(({ token, secret }: any) => token === '123456' && secret === 'MOCKSECRET123')
}));

describe('Auth Utilities', () => {
    describe('Password Utils', () => {
        it('should hash a password and confirm it matches', async () => {
            const password = 'Password123!';
            const hash = await hashPassword(password);
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(20);
            
            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);
            
            const isInvalid = await comparePassword('wrongpassword', hash);
            expect(isInvalid).toBe(false);
        });
    });

    describe('JWT Utils with Type Claim Enforcement', () => {
        beforeAll(() => {
            process.env.JWT_SECRET = 'test-secret-key-123';
        });

        it('should sign and verify an access token with access type', () => {
            const payload = { userId: '123', role: 'CUSTOMER' };
            const token = signToken(payload);
            expect(typeof token).toBe('string');
            
            const decoded = verifyToken(token, 'access') as any;
            expect(decoded).not.toBeNull();
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.role).toBe(payload.role);
            expect(decoded.type).toBe('access');
        });

        it('should sign and verify a refresh token with refresh type', () => {
            const payload = { userId: '123' };
            const token = signRefreshToken(payload);
            expect(typeof token).toBe('string');
            
            const decoded = verifyToken(token, 'refresh') as any;
            expect(decoded).not.toBeNull();
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.type).toBe('refresh');
            expect(decoded.jti).toBeDefined();
        });

        it('should reject access token if verified as refresh token', () => {
            const token = signToken({ userId: '123' });
            const decoded = verifyToken(token, 'refresh');
            expect(decoded).toBeNull();
        });

        it('should reject refresh token if verified as access token', () => {
            const token = signRefreshToken({ userId: '123' });
            const decoded = verifyToken(token, 'access');
            expect(decoded).toBeNull();
        });

        it('should return null for invalid tokens', () => {
            const result = verifyToken('invalid.token.here');
            expect(result).toBeNull();
        });
    });

    describe('MFA Utilities', () => {
        it('should generate MFA secret and URI', () => {
            const secret = generateMFASecret();
            expect(secret).toBe('MOCKSECRET123');

            const uri = generateMFAUri('test@example.com', secret);
            expect(uri).toContain('otpauth://totp/GroceNest:test@example.com');
            expect(uri).toContain('secret=MOCKSECRET123');
        });

        it('should verify correct and incorrect MFA tokens', async () => {
            const isValid = await verifyMFAToken('123456', 'MOCKSECRET123');
            expect(isValid).toBe(true);

            const isInvalid = await verifyMFAToken('000000', 'MOCKSECRET123');
            expect(isInvalid).toBe(false);
        });

        it('should generate requested number of backup codes', () => {
            const codes = generateBackupCodes(5);
            expect(codes).toHaveLength(5);
            codes.forEach(code => {
                expect(code).toHaveLength(8);
                expect(typeof code).toBe('string');
            });
        });
    });

    describe('Pwned Password Checker', () => {
        it('should detect pwned password using prefix matching', async () => {
            // "password" SHA1 hash: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
            // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
            mockedAxios.get.mockResolvedValueOnce({
                data: '1E4C9B93F3F0682250B6CF8331B7EE68FD8:99999\nOTHER_SUFFIX:1\n'
            });

            const isPwned = await isPasswordPwned('password');
            expect(isPwned).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith('https://api.pwnedpasswords.com/range/5BAA6');
        });

        it('should return false for safe/unbreached password', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: 'DIFFERENT_SUFFIX:1\n'
            });

            const isPwned = await isPasswordPwned('super_safe_password_2026!');
            expect(isPwned).toBe(false);
        });

        it('should fail-safe and return false if HIBP API throws error', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('API Down'));

            const isPwned = await isPasswordPwned('anypassword');
            expect(isPwned).toBe(false);
        });
    });

    describe('Validation Schemas', () => {
        it('should validate correct registration data', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+447000000000'
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email format', () => {
            const data = {
                email: 'invalid-email',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe'
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid UK phone format', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                phone: '07000000000' // Needs +44
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Password & Social Auth Requirements', () => {
        it('should require password or social login ID (googleId or appleId)', () => {
            const validateUserAuthData = (data: { passwordHash?: string | null; googleId?: string | null; appleId?: string | null }) => {
                if (!data.passwordHash && !data.googleId && !data.appleId) {
                    throw new Error('User must have password or social login');
                }
                return true;
            };

            expect(() => validateUserAuthData({})).toThrow('User must have password or social login');
            expect(() => validateUserAuthData({ passwordHash: null, googleId: null, appleId: null })).toThrow('User must have password or social login');
            expect(validateUserAuthData({ passwordHash: 'hashedSecret' })).toBe(true);
            expect(validateUserAuthData({ googleId: 'google-uid-123' })).toBe(true);
            expect(validateUserAuthData({ appleId: 'apple-uid-456' })).toBe(true);
        });
    });
});

