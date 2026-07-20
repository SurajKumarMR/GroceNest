jest.mock('./src/services/email.service', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }
}));

jest.mock('./src/services/sms.service', () => ({
  smsService: {
    sendSMS: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
    sendVerificationOTP: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
  }
}));
