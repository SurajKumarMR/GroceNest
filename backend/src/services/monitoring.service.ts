import logger from '../utils/logger';

export interface AlertPayload {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Triggers real-time alerts for payment failures, 5xx error spikes, or security events.
   */
  public async sendAlert(payload: AlertPayload): Promise<void> {
    const logMessage = `[MONITORING ALERT] [${payload.severity}] ${payload.title}: ${payload.message}`;

    if (payload.severity === 'CRITICAL') {
      logger.error(logMessage, payload.metadata);
    } else if (payload.severity === 'WARNING') {
      logger.warn(logMessage, payload.metadata);
    } else {
      logger.info(logMessage, payload.metadata);
    }

    // Production Alert Webhook integration (Slack / PagerDuty / Sentry / Custom Webhook)
    const alertWebhookUrl = process.env.MONITORING_ALERT_WEBHOOK_URL;
    if (alertWebhookUrl) {
      try {
        await fetch(alertWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: logMessage,
            attachments: [
              {
                color: payload.severity === 'CRITICAL' ? '#danger' : '#warning',
                fields: Object.entries(payload.metadata || {}).map(([key, val]) => ({
                  title: key,
                  value: String(val),
                  short: true,
                })),
              },
            ],
          }),
        });
      } catch (err: any) {
        logger.error('[MONITORING] Failed to deliver webhook alert:', err.message);
      }
    }
  }

  /**
   * Track Stripe payment failure alert
   */
  public async alertPaymentFailure(orderId: string, userId: string, amount: number, errorReason: string): Promise<void> {
    await this.sendAlert({
      severity: 'CRITICAL',
      title: 'Stripe Payment Failure',
      message: `Payment of £${amount.toFixed(2)} failed for Order #${orderId}`,
      metadata: { orderId, userId, amount, errorReason },
    });
  }

  /**
   * Track HTTP 5xx error spike alert
   */
  public async alertServerError(endpoint: string, method: string, statusCode: number, errorStack: string): Promise<void> {
    await this.sendAlert({
      severity: 'CRITICAL',
      title: 'HTTP 5xx Server Error Spike',
      message: `${method} ${endpoint} returned HTTP ${statusCode}`,
      metadata: { endpoint, method, statusCode, errorStack },
    });
  }
}

export const monitoringService = MonitoringService.getInstance();
