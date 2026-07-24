import {
  generateMFASecret,
  generateMFAUri,
  generateQRCode,
  verifyMFAToken,
  generateBackupCodes,
} from '../../utils/mfa.utils';
import QRCode from 'qrcode';

describe('MFA Utils', () => {
  it('should generate a valid MFA secret', () => {
    const secret = generateMFASecret();
    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(10);
  });

  it('should generate a valid MFA URI', () => {
    const email = 'user@example.com';
    const secret = generateMFASecret();
    const uri = generateMFAUri(email, secret);

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(encodeURIComponent(email));
    expect(uri).toContain(secret);
  });

  it('should generate a QR code data URL from URI', async () => {
    const uri = 'otpauth://totp/GroceNest:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GroceNest';
    const qrDataUrl = await generateQRCode(uri);

    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('should throw an error if QR code generation fails', async () => {
    jest.spyOn(QRCode, 'toDataURL').mockRejectedValueOnce(new Error('Canvas error') as never);

    await expect(generateQRCode('invalid-uri')).rejects.toThrow('Failed to generate QR code');
    jest.restoreAllMocks();
  });

  it('should verify MFA token against a secret', async () => {
    const secret = generateMFASecret();
    const isValid = await verifyMFAToken('000000', secret);

    expect(typeof isValid).toBe('boolean');
  });

  it('should generate requested number of backup codes', () => {
    const codes = generateBackupCodes(5);

    expect(codes).toHaveLength(5);
    codes.forEach((code) => {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
      expect(code).toBe(code.toUpperCase());
    });
  });
});
