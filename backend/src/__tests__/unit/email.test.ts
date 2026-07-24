jest.unmock('../../services/email.service');
import { emailService } from '../../services/email.service';
import nodemailer from 'nodemailer';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-12345' });

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: mockSendMail
    }))
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    }
}));

describe('SendGrid/Nodemailer Transactional Email Service (email.service.ts)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should export transactional email helper functions', () => {
        expect(typeof emailService.sendEmail).toBe('function');
        expect(typeof emailService.sendVerificationEmail).toBe('function');
        expect(typeof emailService.sendPasswordResetEmail).toBe('function');
        expect(typeof emailService.sendOrderConfirmationEmail).toBe('function');
        expect(typeof emailService.sendDeliveryReceiptEmail).toBe('function');
        expect(typeof emailService.sendRefundNotificationEmail).toBe('function');
        expect(typeof emailService.generateInvoiceAttachment).toBe('function');
    });

    it('should generate formatted invoice attachment with and without items', () => {
        const attachmentWithItems = emailService.generateInvoiceAttachment('GN-99001', 24.50, [
            { name: 'Organic Milk', quantity: 2, price: 2.25 },
            { name: 'Fresh Bread', quantity: 1, price: 1.50 }
        ]);

        expect(attachmentWithItems.filename).toBe('invoice-GN-99001.html');
        expect(attachmentWithItems.contentType).toBe('text/html');
        expect(attachmentWithItems.content).toContain('Invoice #GN-99001');
        expect(attachmentWithItems.content).toContain('Organic Milk');
        expect(attachmentWithItems.content).toContain('£24.50');

        const attachmentEmptyItems = emailService.generateInvoiceAttachment('GN-99002', 10.00, []);
        expect(attachmentEmptyItems.content).toContain('Standard Delivery Order');
    });

    it('should send verification email', async () => {
        process.env.FRONTEND_URL = 'http://localhost:3000';
        const info = await emailService.sendVerificationEmail('test@example.com', 'token-123');

        expect(info).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: 'Verify your email - GroceNest',
            text: expect.stringContaining('http://localhost:3000/verify-email?token=token-123')
        }));
    });

    it('should send password reset email', async () => {
        process.env.FRONTEND_URL = 'http://localhost:3000';
        const info = await emailService.sendPasswordResetEmail('test@example.com', 'token-reset');

        expect(info).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: 'Reset your password - GroceNest',
            text: expect.stringContaining('http://localhost:3000/reset-password?token=token-reset')
        }));
    });

    it('should use SendGrid transport when SENDGRID_API_KEY is configured', async () => {
        process.env.SENDGRID_API_KEY = 'SG.test-key';
        await emailService.sendEmail('user@example.com', 'Subject', 'Text');

        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: { user: 'apikey', pass: 'SG.test-key' }
        }));
    });

    it('should handle email sending errors and throw', async () => {
        mockSendMail.mockRejectedValueOnce(new Error('SMTP connection error'));

        await expect(emailService.sendEmail('err@example.com', 'Err', 'Err')).rejects.toThrow('SMTP connection error');
    });

    it('should send order confirmation email with itemized invoice attachment', async () => {
        const info = await emailService.sendOrderConfirmationEmail(
            'customer@example.com',
            'GN-99001',
            24.50,
            [{ name: 'Organic Milk', quantity: 2, price: 2.25 }, { name: 'Fresh Bread', quantity: 1, price: 1.50 }]
        );
        expect(info).toBeDefined();
        expect(info.messageId).toBe('msg-12345');
    });

    it('should send order delivery receipt email with attached invoice', async () => {
        const info = await emailService.sendDeliveryReceiptEmail(
            'customer@example.com',
            'GN-99001',
            24.50,
            [{ name: 'Organic Milk', quantity: 2, price: 2.25 }]
        );
        expect(info).toBeDefined();
        expect(info.messageId).toBe('msg-12345');
    });

    it('should send refund notification email', async () => {
        const info = await emailService.sendRefundNotificationEmail(
            'customer@example.com',
            'GN-99001',
            24.50,
            'Customer request'
        );
        expect(info).toBeDefined();
        expect(info.messageId).toBe('msg-12345');
    });
});
