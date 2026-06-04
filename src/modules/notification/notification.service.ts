import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure Nodemailer with Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      html: body, // HTML body for better formatting
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #0066cc; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
    
    try {
      await this.sendEmail(email, 'Your Verification Code', htmlBody);
      console.log(`✓ OTP sent successfully to ${email}`);
    } catch (error) {
      // Log OTP to console if email fails (for development)
      console.error('❌ Failed to send email:', error.message);
      console.log('═══════════════════════════════════════');
      console.log(`🔐 OTP FOR TESTING: ${otp}`);
      console.log(`📧 Email: ${email}`);
      console.log('═══════════════════════════════════════');
      console.log('⚠️  Email service error - Use the OTP above for testing');
      
      // In development, don't throw error so login can proceed
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
