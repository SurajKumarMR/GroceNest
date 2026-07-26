import { Request, Response, NextFunction } from 'express';
import { metricsCollector } from '../utils/metrics';
import { monitoringService } from '../services/monitoring.service';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const route = req.baseUrl + (req.route?.path || req.path || '');
        const statusCode = res.statusCode;

        metricsCollector.recordRequest(route, durationMs, statusCode);

        // Alert on latency SLA breach (> 2000ms)
        if (durationMs > 2000) {
            monitoringService.alertLatencySLABreach(route, req.method, durationMs);
        }

        // Alert on 5xx server errors
        if (statusCode >= 500) {
            monitoringService.alertServerError(route, req.method, statusCode, `Request duration: ${durationMs}ms`);
        }
    });

    next();
}
