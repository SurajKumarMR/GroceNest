jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: () => 'KVKFKRJTMR2HSKSK',
        check: () => true,
        keyuri: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
    }
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

import request from 'supertest';
import { app } from '../../index';
import { metricsCollector } from '../../utils/metrics';
import { monitoringService } from '../../services/monitoring.service';

describe('Monitoring & Alerting Unit Tests', () => {
    it('metricsCollector records requests and calculates latency percentiles', () => {
        metricsCollector.recordRequest('/api/test', 50, 200);
        metricsCollector.recordRequest('/api/test', 150, 200);
        metricsCollector.recordRequest('/api/test', 300, 500);

        const pcts = metricsCollector.getLatencyPercentiles();
        expect(pcts.count).toBeGreaterThanOrEqual(3);
        expect(pcts.p50).toBeGreaterThan(0);
        expect(pcts.p95).toBeGreaterThanOrEqual(pcts.p50);
        expect(pcts.p99).toBeGreaterThanOrEqual(pcts.p95);
    });

    it('GET /health/detail returns system telemetry JSON', async () => {
        const res = await request(app).get('/health/detail');

        expect(res.status).toBe(200);
        expect(res.body.uptimeSeconds).toBeDefined();
        expect(res.body.system).toBeDefined();
        expect(res.body.processMemory).toBeDefined();
        expect(res.body.requests).toBeDefined();
        expect(res.body.latencyMs).toBeDefined();
    });

    it('GET /api/metrics returns Prometheus formatted metric text', async () => {
        const res = await request(app).get('/api/metrics');

        expect(res.status).toBe(200);
        expect(res.text).toContain('grocenest_uptime_seconds');
        expect(res.text).toContain('grocenest_http_requests_total');
        expect(res.text).toContain('grocenest_http_request_duration_ms');
    });

    it('monitoringService alertLatencySLABreach dispatches alert log', async () => {
        const sendAlertSpy = jest.spyOn(monitoringService, 'sendAlert');
        
        await monitoringService.alertLatencySLABreach('/api/heavy', 'GET', 2500);

        expect(sendAlertSpy).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'WARNING',
            title: 'API Latency SLA Breach',
        }));

        sendAlertSpy.mockRestore();
    });
});
