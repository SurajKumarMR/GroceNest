
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return; // Ensure we return to stop execution
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token missing' });
        return;
    }

    const payload = verifyToken(token);
    if (!payload) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }

    req.user = payload;
    next();
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
