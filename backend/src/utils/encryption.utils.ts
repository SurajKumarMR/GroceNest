import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long!!'; // Should be 32 chars

if (ENCRYPTION_KEY.length !== KEY_LENGTH) {
  console.warn('ENCRYPTION_KEY should be 32 characters long. Using a padded/truncated version for now.');
}

// Ensure key is 32 bytes
const key = Buffer.alloc(KEY_LENGTH, ENCRYPTION_KEY, 'utf8');

/**
 * Encrypts a string into a format: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string in the format: iv:authTag:encryptedText
 */
export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
  
  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
