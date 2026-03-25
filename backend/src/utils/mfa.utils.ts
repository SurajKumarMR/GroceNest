import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';

/**
 * Generate a new TOTP secret
 */
export const generateMFASecret = () => {
  return generateSecret();
};

/**
 * Generate a TOPT dynamic URI for QR codes
 */
export const generateMFAUri = (userEmail: string, secret: string) => {
  return generateURI({
    issuer: 'GroceNest',
    label: userEmail,
    secret: secret,
  });
};

/**
 * Generate a QR code data URL from a URI
 */
export const generateQRCode = async (uri: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(uri);
  } catch (err) {
    console.error('QR Code generation error:', err);
    throw new Error('Failed to generate QR code');
  }
};



/**
 * Verify a TOTP token against a secret
 */
export const verifyMFAToken = async (token: string, secret: string): Promise<boolean> => {
  return await verify({ token, secret }) as unknown as boolean;
};

/**
 * Generate backup codes (simple implementation)
 */
export const generateBackupCodes = (count: number = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
};
