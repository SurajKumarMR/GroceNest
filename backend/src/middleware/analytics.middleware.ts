import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent');

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        // In a real production app, we would send this to Mixpanel, Segment, or a dedicated DB
        // For launch readiness, we log it with a structured format for easy ingestion
        logger.info(`[ANALYTICS] ${new Date().toISOString()} | ${method} ${url} | Status: ${status} | Duration: ${duration}ms | IP: ${ip} | UA: ${userAgent}`);
        
        // Example: Capture specific events like checkout or signup
        if (url === '/api/payments/confirm' && status === 200) {
            logger.info(`[EVENT] CHECKOUT_COMPLETED | User: ${(req as any).user?.userId || 'Guest'}`);
        }
    });

    next();
};
