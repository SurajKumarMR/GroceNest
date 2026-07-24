import { hashPassword, comparePassword } from '../../utils/password.utils';

describe('Password Utilities (password.utils.ts)', () => {
  it('should hash a plain text password successfully', async () => {
    const plainPassword = 'SuperSecretPassword123!';
    const hash = await hashPassword(plainPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plainPassword);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('should verify matching plain text password against hash', async () => {
    const plainPassword = 'MySecurePassword890';
    const hash = await hashPassword(plainPassword);

    const isMatch = await comparePassword(plainPassword, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect plain text password against hash', async () => {
    const plainPassword = 'CorrectPassword123';
    const wrongPassword = 'WrongPassword123';
    const hash = await hashPassword(plainPassword);

    const isMatch = await comparePassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});
