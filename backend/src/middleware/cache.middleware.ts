import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';

/**
 * Express Middleware for caching HTTP GET responses in Redis.
 *
 * @param durationSeconds Time-To-Live (TTL) in seconds
 * @param keyPrefix Optional prefix for cache key (default: 'cache:http:')
 */
export const cacheMiddleware = (durationSeconds: number = 300, keyPrefix: string = 'cache:http:') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            next();
            return;
        }

        const cacheKey = `${keyPrefix}${req.originalUrl || req.url}`;

        try {
            const cachedBody = await redisService.get<any>(cacheKey);
            if (cachedBody) {
                res.setHeader('X-Cache', 'HIT');
                res.json(cachedBody);
                return;
            }
        } catch (error) {
            console.warn('[CacheMiddleware] Failed to read from Redis, passing through:', error);
        }

        res.setHeader('X-Cache', 'MISS');

        // Intercept res.json to capture response payload
        const originalJson = res.json.bind(res);
        res.json = (body: any): Response => {
            // Only cache successful 200 responses
            if (res.statusCode === 200 && body) {
                redisService.set(cacheKey, body, durationSeconds).catch(err => {
                    console.warn('[CacheMiddleware] Failed to write cache to Redis:', err);
                });
            }
            return originalJson(body);
        };

        next();
    };
};
