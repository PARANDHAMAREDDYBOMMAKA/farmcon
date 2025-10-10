/**
 * Email Service - Unified interface for sending emails
 *
 * Supports multiple providers:
 * 1. Brevo (Sendinblue) - RECOMMENDED FREE OPTION
 *    - 300 emails/day free
 *    - Better deliverability than Gmail
 *    - Professional email templates
 *    - Sign up: https://www.brevo.com
 *    - Set BREVO_API_KEY in .env
 *
 * 2. Nodemailer (Gmail SMTP)
 *    - Fallback option
 *    - Requires Gmail App Password
 *    - Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env
 */

import nodemailer from 'nodemailer'
import * as brevo from '@getbrevo/brevo'

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

export type EmailProvider = 'brevo' | 'nodemailer' | 'auto'

class EmailService {
  private provider: EmailProvider = 'auto'
  private brevoApiInstance?: brevo.TransactionalEmailsApi

  /**
   * Initialize email service
   * Auto-detects available provider based on environment variables
   */
  constructor() {
    // Check if Brevo API key is configured
    if (process.env.BREVO_API_KEY) {
      try {
        // Set API key for Brevo
        const apiInstance = new brevo.TransactionalEmailsApi()
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)
        this.brevoApiInstance = apiInstance
        this.provider = 'brevo'
        console.log('[EmailService] Using Brevo as email provider')
      } catch (error) {
        console.error('[EmailService] Failed to initialize Brevo:', error)
        this.provider = 'nodemailer'
      }
    } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.provider = 'nodemailer'
      console.log('[EmailService] Using Nodemailer as email provider')
    } else {
      console.warn('[EmailService] No email provider configured!')
    }
  }

  /**
   * Send email using the configured provider
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (this.provider === 'brevo' && this.brevoApiInstance) {
        return await this.sendWithBrevo(options)
      } else if (this.provider === 'nodemailer') {
        return await this.sendWithNodemailer(options)
      } else {
        console.error('[EmailService] No email provider available')
        return false
      }
    } catch (error) {
      console.error('[EmailService] Send email error:', error)
      return false
    }
  }

  /**
   * Send email using Brevo (Sendinblue)
   */
  private async sendWithBrevo(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.brevoApiInstance) {
        throw new Error('Brevo API not initialized')
      }

      const sendSmtpEmail = new brevo.SendSmtpEmail()

      // Set sender
      sendSmtpEmail.sender = {
        name: options.from?.name || 'FarmCon',
        email: options.from?.email || process.env.EMAIL_USER || 'noreply@farmcon.com'
      }

      // Set recipient(s)
      if (Array.isArray(options.to)) {
        sendSmtpEmail.to = options.to.map(email => ({ email }))
      } else {
        sendSmtpEmail.to = [{ email: options.to }]
      }

      // Set content
      sendSmtpEmail.subject = options.subject
      sendSmtpEmail.htmlContent = options.html
      if (options.text) {
        sendSmtpEmail.textContent = options.text
      }

      const result = await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('[EmailService] Brevo email sent successfully:', result.body.messageId)
      return true
    } catch (error) {
      console.error('[EmailService] Brevo send error:', error)
      throw error
    }
  }

  /**
   * Send email using Nodemailer
   */
  private async sendWithNodemailer(options: EmailOptions): Promise<boolean> {
    try {
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
      console.log('[EmailService] Nodemailer email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('[EmailService] Nodemailer send error:', error)
      throw error
    }
  }

  /**
   * Get current provider
   */
  getProvider(): EmailProvider {
    return this.provider
  }
}

// Export singleton instance
export const emailService = new EmailService()
