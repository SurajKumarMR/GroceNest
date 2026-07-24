import { monitoringService } from '../../services/monitoring.service';
import logger from '../../utils/logger';

describe('Monitoring & Alerting Service', () => {
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerInfoSpy: jest.SpyInstance;
  let globalFetchSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    globalFetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
    delete process.env.MONITORING_ALERT_WEBHOOK_URL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log CRITICAL alert when payment failure occurs', async () => {
    await monitoringService.alertPaymentFailure('order-123', 'user-456', 49.99, 'Card Declined');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[MONITORING ALERT] [CRITICAL] Stripe Payment Failure: Payment of £49.99 failed for Order #order-123'),
      expect.objectContaining({ orderId: 'order-123', userId: 'user-456', amount: 49.99, errorReason: 'Card Declined' })
    );
  });

  it('should log CRITICAL alert on 5xx server error spike', async () => {
    await monitoringService.alertServerError('/api/orders/checkout', 'POST', 500, 'Error: Database connection lost');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[MONITORING ALERT] [CRITICAL] HTTP 5xx Server Error Spike: POST /api/orders/checkout returned HTTP 500'),
      expect.objectContaining({ endpoint: '/api/orders/checkout', method: 'POST', statusCode: 500 })
    );
  });

  it('should dispatch alert to webhook when MONITORING_ALERT_WEBHOOK_URL is configured', async () => {
    process.env.MONITORING_ALERT_WEBHOOK_URL = 'https://hooks.slack.com/services/test/webhook';

    await monitoringService.sendAlert({
      severity: 'CRITICAL',
      title: 'Payment Gateway Timeout',
      message: 'Stripe API did not respond within 3000ms',
      metadata: { gateway: 'stripe' },
    });

    expect(globalFetchSpy).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/test/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should log info/warn for non-critical alerts', async () => {
    await monitoringService.sendAlert({
      severity: 'WARNING',
      title: 'High CPU Usage',
      message: 'CPU reached 85%',
    });
    expect(loggerWarnSpy).toHaveBeenCalled();

    await monitoringService.sendAlert({
      severity: 'INFO',
      title: 'System Startup',
      message: 'Backend started',
    });
    expect(loggerInfoSpy).toHaveBeenCalled();
  });
});
