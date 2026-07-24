import { smsService } from '../../services/sms.service';
import logger from '../../utils/logger';

describe('SMS Service', () => {
  it('should send SMS in mock mode when NODE_ENV is test', async () => {
    const loggerSpy = jest.spyOn(logger, 'info');

    const result = await smsService.sendSMS('+15551234567', 'Test message');
    expect(result).toEqual({ success: true, mock: true });
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[SMS MOCK] To: +15551234567'));

    loggerSpy.mockRestore();
  });

  it('should send verification OTP via sendSMS', async () => {
    const sendSMSSpy = jest.spyOn(smsService, 'sendSMS');

    const result = await smsService.sendVerificationOTP('+15551234567', '123456');
    expect(result).toEqual({ success: true, mock: true });
    expect(sendSMSSpy).toHaveBeenCalledWith('+15551234567', 'Your GroceNest verification code is: 123456');

    sendSMSSpy.mockRestore();
  });
});
