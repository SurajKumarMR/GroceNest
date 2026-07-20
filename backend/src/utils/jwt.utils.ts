import jwt, { SignOptions, Algorithm } from 'jsonwebtoken';
import logger from './logger';
import crypto from 'crypto';

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as any;

if (process.env.NODE_ENV === 'production' && (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY)) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be defined in production for RS256');
}

export const signToken = (payload: object, expiresIn?: string | number) => {
    // In production, force RS256
    if (JWT_PRIVATE_KEY) {
        return jwt.sign(payload, JWT_PRIVATE_KEY, { 
            algorithm: 'RS256',
            expiresIn: (expiresIn || JWT_EXPIRES_IN) as any
        } as SignOptions);
    }

    // Fallback for development only
    if (process.env.NODE_ENV !== 'production' && JWT_SECRET) {
        logger.warn('Using symmetric HS256 for JWT. Switch to RS256 for production hardening.');
        return jwt.sign(payload, JWT_SECRET, { 
            algorithm: 'HS256',
            expiresIn: (expiresIn || JWT_EXPIRES_IN) as any
        } as SignOptions);
    }

    throw new Error('No JWT signing key provided');
};

export const verifyToken = (token: string) => {
    try {
        if (JWT_PUBLIC_KEY) {
            return jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
        }
        
        // Fallback for development
        if (process.env.NODE_ENV !== 'production' && JWT_SECRET) {
            return jwt.verify(token, JWT_SECRET);
        }

        return null;
    } catch (error) {
        logger.error('JWT Verification Error:', (error as Error).message);
        return null;
    }
};

export const signRefreshToken = (payload: object) => {
    const secret = (JWT_PRIVATE_KEY || JWT_SECRET || 'refresh-secret') as string;
    const algorithm = (JWT_PRIVATE_KEY ? 'RS256' : 'HS256') as Algorithm;
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, secret, { 
        algorithm,
        expiresIn: '7d' 
    } as SignOptions);
};

