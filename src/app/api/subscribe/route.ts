import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// Configure nodemailer transporter using Gmail SMTP from .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email },
    })

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 400 }
        )
      } else {
        // Reactivate subscription
        await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            isActive: true,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        })
      }
    } else {
      // Create new subscription
      await prisma.newsletterSubscription.create({
        data: { email },
      })
    }

    // Send welcome email
    try {
      await transporter.sendMail({
        from: `"FarmCon" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to FarmCon Newsletter! 🌾',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  color: white;
                  padding: 40px 20px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .header h1 {
                  margin: 0;
                  font-size: 32px;
                }
                .header p {
                  margin: 10px 0 0;
                  font-size: 16px;
                  opacity: 0.9;
                }
                .content {
                  background: #fff;
                  padding: 40px 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .content h2 {
                  color: #059669;
                  margin-top: 0;
                }
                .benefits {
                  background: #f0fdf4;
                  border-left: 4px solid #10b981;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .benefits ul {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .benefits li {
                  margin: 8px 0;
                }
                .cta {
                  text-align: center;
                  margin: 30px 0;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  color: white;
                  padding: 14px 30px;
                  text-decoration: none;
                  border-radius: 25px;
                  font-weight: 600;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .footer {
                  background: #f9fafb;
                  padding: 30px;
                  text-align: center;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                  border-radius: 0 0 10px 10px;
                  font-size: 14px;
                  color: #6b7280;
                }
                .footer a {
                  color: #059669;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto 20px;">
                  <path d="M2 22 17 7"></path>
                  <path d="m12 17-5 5-1.5-1.5L10 16"></path>
                  <path d="M9.5 12.5 12 15"></path>
                  <path d="m3.64 18.36.96.96"></path>
                  <path d="m4.17 15.11 3.54 3.54"></path>
                  <path d="m9.39 9.86 3.53 3.53"></path>
                  <path d="M17 2h5v5"></path>
                </svg>
                <h1>Welcome to FarmCon!</h1>
                <p>Your journey to smarter farming starts here</p>
              </div>

              <div class="content">
                <h2>Thank you for subscribing!</h2>
                <p>Dear Farmer,</p>
                <p>We're thrilled to have you join the FarmCon community! You've taken the first step towards transforming your farming experience with cutting-edge technology.</p>

                <div class="benefits">
                  <strong style="color: #059669; font-size: 18px;">Here's what you'll receive:</strong>
                  <ul style="list-style-type: none; padding-left: 0;">
                    <li style="padding: 8px 0; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 12px; font-weight: bold; flex-shrink: 0;">✓</span>
                      <span>Real-time market price updates and trends</span>
                    </li>
                    <li style="padding: 8px 0; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 12px; font-weight: bold; flex-shrink: 0;">✓</span>
                      <span>Expert farming tips and best practices</span>
                    </li>
                    <li style="padding: 8px 0; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 12px; font-weight: bold; flex-shrink: 0;">✓</span>
                      <span>New feature announcements and updates</span>
                    </li>
                    <li style="padding: 8px 0; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 12px; font-weight: bold; flex-shrink: 0;">✓</span>
                      <span>Exclusive offers and early access</span>
                    </li>
                    <li style="padding: 8px 0; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 12px; font-weight: bold; flex-shrink: 0;">✓</span>
                      <span>Educational content and success stories</span>
                    </li>
                  </ul>
                </div>

                <p>Our newsletter is delivered straight to your inbox, keeping you informed about everything that matters to your farm's success.</p>

                <div class="cta">
                  <a href="/auth/signup" class="button">
                    Get Started with FarmCon
                  </a>
                </div>

                <p><strong>Join thousands of farmers</strong> who are already increasing their yields by 40% and profits by 60% with FarmCon.</p>
              </div>

              <div class="footer">
                <p><strong>FarmCon - Smart Farming Platform</strong></p>
                <p>Empowering Indian farmers with cutting-edge technology</p>
                <p style="margin-top: 20px;">
                  <strong>Phone:</strong> +91 1800-XXX-XXXX (Toll Free) |
                  <strong>Email:</strong> <a href="mailto:support@farmcon.in">support@farmcon.in</a>
                </p>
                <p style="margin-top: 20px; font-size: 12px;">
                  You're receiving this email because you subscribed to FarmCon newsletter.<br>
                  Don't want these emails? Contact us at support@farmcon.in
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
Welcome to FarmCon Newsletter!

Thank you for subscribing!

Dear Farmer,

We're thrilled to have you join the FarmCon community! You've taken the first step towards transforming your farming experience with cutting-edge technology.

Here's what you'll receive:
✓ Real-time market price updates and trends
✓ Expert farming tips and best practices
✓ New feature announcements and updates
✓ Exclusive offers and early access
✓ Educational content and success stories

Our newsletter is delivered straight to your inbox, keeping you informed about everything that matters to your farm's success.

Join thousands of farmers who are already increasing their yields by 40% and profits by 60% with FarmCon.

Visit our website to get started.

---
FarmCon - Smart Farming Platform
Empowering Indian farmers with cutting-edge technology

Phone: +91 1800-XXX-XXXX (Toll Free)
Email: support@farmcon.in
        `,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the subscription if email fails
    }

    return NextResponse.json(
      {
        message: 'Successfully subscribed to newsletter',
        email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    )
  }
}
