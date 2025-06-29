// Email service implementation
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Mock email sending - replace with actual email service (SendGrid, Mailgun, etc.)
  console.log('Sending email:', options);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
}

export function generateVerificationEmailHtml(name: string, verificationCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - NaijaStore</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Welcome to NaijaStore!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account with NaijaStore. To complete your registration, please verify your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?code=${verificationCode}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}/verify-email?code=${verificationCode}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The NaijaStore Team
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmailHtml(name: string, resetCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - NaijaStore</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your NaijaStore account. Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?code=${resetCode}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}/reset-password?code=${resetCode}</p>
        <p>This reset link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The NaijaStore Team
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateOrderConfirmationEmailHtml(name: string, order: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - NaijaStore</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a;">Order Confirmation</h1>
        <p>Hi ${name},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <p>We'll send you another email when your order ships.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The NaijaStore Team
        </p>
      </div>
    </body>
    </html>
  `;
}