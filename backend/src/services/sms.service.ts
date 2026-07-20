import logger from '../utils/logger';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export const smsService = {
  sendSMS: async (to: string, message: string) => {
    try {
      if (!twilioClient || process.env.NODE_ENV === 'test') {
        logger.info(`[SMS MOCK] To: ${to}, Message: ${message}`);
        return { success: true, mock: true };
      }
      
      const response = await twilioClient.messages.create({
        body: message,
        to,
        from: fromPhone || '+1234567890'
      });
      
      logger.info(`SMS sent successfully to ${to}, SID: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (error: any) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  },

  sendVerificationOTP: async (to: string, code: string) => {
    return smsService.sendSMS(to, `Your GroceNest verification code is: ${code}`);
  },
};
