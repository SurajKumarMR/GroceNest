jest.unmock('../../services/email.service');
import { emailService } from '../../services/email.service';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-12345' })
    })
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
    it('should export transactional email helper functions', () => {
        expect(typeof emailService.sendEmail).toBe('function');
        expect(typeof emailService.sendVerificationEmail).toBe('function');
        expect(typeof emailService.sendPasswordResetEmail).toBe('function');
        expect(typeof emailService.sendOrderConfirmationEmail).toBe('function');
        expect(typeof emailService.sendDeliveryReceiptEmail).toBe('function');
        expect(typeof emailService.sendRefundNotificationEmail).toBe('function');
        expect(typeof emailService.generateInvoiceAttachment).toBe('function');
    });

    it('should generate formatted invoice attachment', () => {
        const attachment = emailService.generateInvoiceAttachment('GN-99001', 24.50, [
            { name: 'Organic Milk', quantity: 2, price: 2.25 },
            { name: 'Fresh Bread', quantity: 1, price: 1.50 }
        ]);

        expect(attachment.filename).toBe('invoice-GN-99001.html');
        expect(attachment.contentType).toBe('text/html');
        expect(attachment.content).toContain('Invoice #GN-99001');
        expect(attachment.content).toContain('Organic Milk');
        expect(attachment.content).toContain('£24.50');
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
