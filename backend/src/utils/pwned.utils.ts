import axios from 'axios';
import crypto from 'crypto';

/**
 * Checks if a password has been pwned using the HaveIBeenPwned range API.
 * This implementation is privacy-preserving as it only sends the first 5 characters
 * of the SHA-1 hash of the password.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    try {
        const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
        const hashes = response.data.split('\n');
        
        return hashes.some((h: string) => h.startsWith(suffix));
    } catch (error) {
        console.error('HaveIBeenPwned API error:', error);
        // Default to false (allow) if API is down to avoid blocking users, 
        // though in high-security environments we might want to default to true.
        return false; 
    }
}
