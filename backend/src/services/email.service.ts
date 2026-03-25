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
};
