import logger from '../utils/logger';

// Placeholder for SMS provider (e.g., Twilio / AWS SNS / Vonage)
export const smsService = {
  sendSMS: async (to: string, message: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[SMS MOCK] To: ${to}, Message: ${message}`);
        return { success: true, mock: true };
      }
      
      // Real implementation would go here:
      // const twilio = require('twilio')(sid, auth);
      // await twilio.messages.create({ body: message, to, from: '+' });
      
      logger.info(`SMS service triggered for ${to} (Implementation pending real API keys)`);
      return { success: true };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  },

  sendVerificationOTP: async (to: string, code: string) => {
    return smsService.sendSMS(to, `Your GroceNest verification code is: ${code}`);
  },
};
