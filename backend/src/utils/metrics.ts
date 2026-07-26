import os from 'os';
import { getDbConnectionPoolMetrics } from './prisma';

interface LatencyRecord {
    route: string;
    durationMs: number;
    timestamp: number;
}

class MetricsCollector {
    private requestCount = 0;
    private status2xx = 0;
    private status4xx = 0;
    private status5xx = 0;
    private latencies: LatencyRecord[] = [];
    private maxLatencyHistory = 500;

    /**
     * Records an incoming HTTP request response duration and status code
     */
    public recordRequest(route: string, durationMs: number, statusCode: number): void {
        this.requestCount++;
        if (statusCode >= 200 && statusCode < 400) {
            this.status2xx++;
        } else if (statusCode >= 400 && statusCode < 500) {
            this.status4xx++;
        } else if (statusCode >= 500) {
            this.status5xx++;
        }

        this.latencies.push({ route, durationMs, timestamp: Date.now() });
        if (this.latencies.length > this.maxLatencyHistory) {
            this.latencies.shift();
        }
    }

    /**
     * Calculates latency percentiles (p50, p95, p99) in milliseconds
     */
    public getLatencyPercentiles(): { p50: number; p95: number; p99: number; count: number } {
        if (this.latencies.length === 0) {
            return { p50: 0, p95: 0, p99: 0, count: 0 };
        }

        const sorted = [...this.latencies].map(l => l.durationMs).sort((a, b) => a - b);
        const len = sorted.length;

        const getPercentile = (pct: number) => {
            const index = Math.ceil((pct / 100) * len) - 1;
            return sorted[Math.max(0, index)] || 0;
        };

        return {
            p50: Number(getPercentile(50).toFixed(2)),
            p95: Number(getPercentile(95).toFixed(2)),
            p99: Number(getPercentile(99).toFixed(2)),
            count: len,
        };
    }

    /**
     * Returns JSON telemetry summary for system status endpoints
     */
    public async getSystemTelemetryJSON() {
        const mem = process.memoryUsage();
        const poolMetrics = await getDbConnectionPoolMetrics().catch(() => ({}));
        const percentiles = this.getLatencyPercentiles();

        return {
            uptimeSeconds: Math.floor(process.uptime()),
            system: {
                platform: process.platform,
                cpuCores: os.cpus().length,
                totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
                freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
            },
            processMemory: {
                rssMb: Math.round(mem.rss / 1024 / 1024),
                heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
                heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            },
            requests: {
                totalRequests: this.requestCount,
                status2xx: this.status2xx,
                status4xx: this.status4xx,
                status5xx: this.status5xx,
            },
            latencyMs: percentiles,
            databasePool: poolMetrics,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Formats metrics in standard Prometheus text format (/api/metrics)
     */
    public async getPrometheusFormat(): Promise<string> {
        const telemetry = await this.getSystemTelemetryJSON();
        const percentiles = telemetry.latencyMs;

        const lines: string[] = [
            '# HELP grocenest_uptime_seconds Total process uptime in seconds.',
            '# TYPE grocenest_uptime_seconds counter',
            `grocenest_uptime_seconds ${telemetry.uptimeSeconds}`,
            '',
            '# HELP grocenest_http_requests_total Total number of HTTP requests processed.',
            '# TYPE grocenest_http_requests_total counter',
            `grocenest_http_requests_total{status_class="2xx"} ${telemetry.requests.status2xx}`,
            `grocenest_http_requests_total{status_class="4xx"} ${telemetry.requests.status4xx}`,
            `grocenest_http_requests_total{status_class="5xx"} ${telemetry.requests.status5xx}`,
            '',
            '# HELP grocenest_http_request_duration_ms API response latency percentiles in ms.',
            '# TYPE grocenest_http_request_duration_ms gauge',
            `grocenest_http_request_duration_ms{quantile="0.5"} ${percentiles.p50}`,
            `grocenest_http_request_duration_ms{quantile="0.95"} ${percentiles.p95}`,
            `grocenest_http_request_duration_ms{quantile="0.99"} ${percentiles.p99}`,
            '',
            '# HELP grocenest_process_memory_heap_used_bytes Heap memory used in bytes.',
            '# TYPE grocenest_process_memory_heap_used_bytes gauge',
            `grocenest_process_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`,
            '',
            '# HELP grocenest_db_connections_active Number of active DB pool connections.',
            '# TYPE grocenest_db_connections_active gauge',
            `grocenest_db_connections_active ${(telemetry.databasePool as any)?.activeConnections || 0}`,
            '',
            '# HELP grocenest_db_connections_idle Number of idle DB pool connections.',
            '# TYPE grocenest_db_connections_idle gauge',
            `grocenest_db_connections_idle ${(telemetry.databasePool as any)?.idleConnections || 0}`,
            ''
        ];

        return lines.join('\n');
    }
}

export const metricsCollector = new MetricsCollector();
