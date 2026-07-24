import { encrypt, decrypt } from '../../utils/encryption.utils';

describe('Encryption Utils', () => {
  it('should encrypt a plain text string into iv:authTag:encryptedText format', () => {
    const text = 'Hello, GroceNest!';
    const encrypted = encrypt(text);

    expect(encrypted).toBeDefined();
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0]).toMatch(/^[0-9a-f]+$/i); // IV
    expect(parts[1]).toMatch(/^[0-9a-f]+$/i); // authTag
    expect(parts[2]).toMatch(/^[0-9a-f]+$/i); // ciphertext
  });

  it('should correctly decrypt encrypted data back to original text', () => {
    const originalText = 'Sensitive-User-Token-12345';
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(originalText);
  });

  it('should throw an error when decrypting invalid format (missing parts)', () => {
    expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted data format');
    expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted data format');
  });

  it('should throw an error when decrypting tampered data', () => {
    const encrypted = encrypt('Secret message');
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:bad1234567890abcdef`;

    expect(() => decrypt(tampered)).toThrow();
  });
});
