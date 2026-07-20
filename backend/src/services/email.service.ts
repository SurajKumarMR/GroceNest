import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const emailService = {
  sendEmail: async (to: string, subject: string, text: string, html?: string) => {
    try {
      const info = await transporter.sendMail({
        from: `"GroceNest" <${process.env.EMAIL_FROM || 'noreply@grocenest.com'}>`,
        to,
        subject,
        text,
        html: html || text,
      });
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  },

  sendVerificationEmail: async (to: string, token: string) => {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    return emailService.sendEmail(
      to,
      'Verify your email - GroceNest',
      `Please verify your email by clicking: ${url}`,
      `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`
    );
  },

  sendPasswordResetEmail: async (to: string, token: string) => {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    return emailService.sendEmail(
      to,
      'Reset your password - GroceNest',
      `Reset your password by clicking: ${url}`,
      `<p>Reset your password by clicking <a href="${url}">here</a>.</p>`
    );
  },

  sendOrderConfirmationEmail: async (to: string, orderNumber: string, totalAmount: number, items: { name: string; quantity: number; price: number }[]) => {
    const subject = `Order Confirmation #${orderNumber} - GroceNest`;
    const itemsHtml = items.map(item => `<li>${item.quantity}x ${item.name} - £${Number(item.price).toFixed(2)}</li>`).join('');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #4CAF50; text-align: center;">Order Confirmed!</h1>
        <p>Thank you for shopping with GroceNest. Your order <strong>#${orderNumber}</strong> has been received and is being prepared.</p>
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px;">Order Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          ${itemsHtml}
        </ul>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Total Amount Paid: £${totalAmount.toFixed(2)}</p>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
          This is an automated receipt from GroceNest. If you have any questions, please contact our support team.
        </p>
      </div>
    `;
    const text = `Thank you for your order #${orderNumber}! Total Amount Paid: £${totalAmount.toFixed(2)}.`;
    return emailService.sendEmail(to, subject, text, html);
  },
};
