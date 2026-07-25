
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token missing' });
        return;
    }

    const payload: any = verifyToken(token);
    if (!payload || !payload.userId) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isActive: true, lastLogoutAt: true }
        });

        if (user) {
            if (!user.isActive) {
                res.status(403).json({ error: 'Account is deactivated. Please contact support.' });
                return;
            }

            if (user.lastLogoutAt && payload.iat) {
                const lastLogoutSec = Math.floor(user.lastLogoutAt.getTime() / 1000);
                if (payload.iat <= lastLogoutSec) {
                    res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                    return;
                }
            }
        }

        req.user = payload;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }

        next();
    };
};
