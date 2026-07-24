import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const getTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async (to: string, subject: string, text: string, html?: string, attachments?: any[]) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"GroceNest" <${process.env.EMAIL_FROM || 'noreply@grocenest.com'}>`,
      to,
      subject,
      text,
      html: html || text,
      attachments,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

const generateInvoiceAttachment = (
  orderNumber: string,
  totalAmount: number,
  items: { name: string; quantity: number; price: number }[] = []
) => {
  const itemsTable = items.length > 0 
    ? items.map(i => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${i.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${Number(i.price).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${(i.quantity * Number(i.price)).toFixed(2)}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 8px; text-align: center;">Standard Delivery Order</td></tr>`;

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px;">
        <h2 style="color: #4CAF50; margin-top: 0;">GroceNest Invoice</h2>
        <p><strong>Invoice Number:</strong> INV-${orderNumber}</p>
        <p><strong>Order Reference:</strong> #${orderNumber}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Price</th>
              <th style="padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>
        <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px;">
          Total Paid: £${totalAmount.toFixed(2)}
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 40px; text-align: center;">
          Thank you for ordering with GroceNest!
        </p>
      </div>
    </body>
    </html>
  `;

  return {
    filename: `invoice-${orderNumber}.html`,
    content: invoiceHtml,
    contentType: 'text/html',
  };
};

export const emailService = {
  sendEmail,
  generateInvoiceAttachment,

  sendVerificationEmail: async (to: string, token: string) => {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    return sendEmail(
      to,
      'Verify your email - GroceNest',
      `Please verify your email by clicking: ${url}`,
      `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`
    );
  },

  sendPasswordResetEmail: async (to: string, token: string) => {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    return sendEmail(
      to,
      'Reset your password - GroceNest',
      `Reset your password by clicking: ${url}`,
      `<p>Reset your password by clicking <a href="${url}">here</a>.</p>`
    );
  },

  sendOrderConfirmationEmail: async (
    to: string, 
    orderNumber: string, 
    totalAmount: number, 
    items: { name: string; quantity: number; price: number }[] = [],
    customAttachments?: any[]
  ) => {
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
          Your itemized invoice is attached to this email. If you have any questions, please contact our support team.
        </p>
      </div>
    `;
    const text = `Thank you for your order #${orderNumber}! Total Amount Paid: £${totalAmount.toFixed(2)}. Your invoice is attached.`;
    
    const invoiceAttachment = generateInvoiceAttachment(orderNumber, totalAmount, items);
    const attachments = customAttachments || [invoiceAttachment];

    return sendEmail(to, subject, text, html, attachments);
  },

  sendDeliveryReceiptEmail: async (
    to: string, 
    orderNumber: string, 
    totalAmount: number,
    items: { name: string; quantity: number; price: number }[] = [],
    customAttachments?: any[]
  ) => {
    const subject = `Order Delivered #${orderNumber} - GroceNest Receipt`;
    const text = `Your GroceNest order #${orderNumber} has been delivered! Total Paid: £${totalAmount.toFixed(2)}. Thank you for shopping with us. Your delivery receipt is attached.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #4CAF50; text-align: center;">Order Delivered!</h1>
        <p>Your order <strong>#${orderNumber}</strong> has been successfully delivered.</p>
        <p>Total Paid: <strong>£${totalAmount.toFixed(2)}</strong></p>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">Thank you for shopping with GroceNest. Your official receipt/invoice is attached.</p>
      </div>
    `;
    const invoiceAttachment = generateInvoiceAttachment(orderNumber, totalAmount, items);
    const attachments = customAttachments || [invoiceAttachment];

    return sendEmail(to, subject, text, html, attachments);
  },

  sendRefundNotificationEmail: async (to: string, orderNumber: string, refundAmount: number, reason?: string, customAttachments?: any[]) => {
    const subject = `Refund Processed for Order #${orderNumber} - GroceNest`;
    const text = `A refund of £${refundAmount.toFixed(2)} has been processed for your order #${orderNumber}.${reason ? ` Reason: ${reason}` : ''}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #FF9800; text-align: center;">Refund Processed</h1>
        <p>A refund of <strong>£${refundAmount.toFixed(2)}</strong> has been processed for your order <strong>#${orderNumber}</strong>.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <p style="font-size: 12px; color: #888; margin-top: 20px;">Funds will reflect in your account within 5-10 business days depending on your bank.</p>
      </div>
    `;
    return sendEmail(to, subject, text, html, customAttachments);
  },
};

