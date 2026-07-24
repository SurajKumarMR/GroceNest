jest.mock('./src/services/email.service', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendDeliveryReceiptEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    sendRefundNotificationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    generateInvoiceAttachment: jest.fn().mockReturnValue({ filename: 'invoice.html', content: '<html></html>', contentType: 'text/html' }),
  }
}));

jest.mock('./src/services/sms.service', () => ({
  smsService: {
    sendSMS: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
    sendVerificationOTP: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
  }
}));
