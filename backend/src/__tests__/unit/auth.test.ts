
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { signToken, verifyToken } from '../../utils/jwt.utils';
import { registerSchema } from '../../utils/validation';

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

    describe('JWT Utils', () => {
        it('should sign and verify a token', () => {
            const payload = { userId: '123', role: 'CUSTOMER' };
            const token = signToken(payload);
            expect(typeof token).toBe('string');
            
            const decoded = verifyToken(token) as any;
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.role).toBe(payload.role);
        });

        it('should return null for invalid tokens', () => {
            const result = verifyToken('invalid.token.here');
            expect(result).toBeNull();
        });
    });

    describe('Validation Schemas', () => {
        it('should validate correct registration data', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
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
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject invalid UK phone format', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                phone: '07000000000' // Needs +44
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
