/**
 * Email Service - Unified interface for sending emails
 *
 * Uses Nodemailer with Gmail SMTP
 * - Requires Gmail App Password
 * - Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env
 */

import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: {
    name: string
    email: string
  }
}

class EmailService {
  /**
   * Send email using Nodemailer
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('[EmailService] Email not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env')
        return false
      }

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })

      const mailOptions = {
        from: options.from
          ? `"${options.from.name}" <${options.from.email}>`
          : `"FarmCon" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('[EmailService] Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('[EmailService] Send email error:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
