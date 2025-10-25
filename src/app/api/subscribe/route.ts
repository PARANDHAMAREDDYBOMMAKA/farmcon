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
        from: `"FarmCon - Smart Farming Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🌾 Welcome to FarmCon! Your Smart Farming Journey Begins',
        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to FarmCon</title>
              <!--[if mso]>
              <style type="text/css">
                body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
              </style>
              <![endif]-->
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                  line-height: 1.7;
                  color: #1f2937;
                  background-color: #f3f4f6;
                  padding: 0;
                  margin: 0;
                }
                .email-container {
                  max-width: 650px;
                  margin: 40px auto;
                  background: #ffffff;
                  border-radius: 24px;
                  overflow: hidden;
                  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                }
                .hero-section {
                  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
                  padding: 50px 40px;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
                }
                .hero-section::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background-image: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
                }
                .logo-container {
                  width: 80px;
                  height: 80px;
                  background: rgba(255, 255, 255, 0.2);
                  backdrop-filter: blur(10px);
                  border-radius: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 24px;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  position: relative;
                  z-index: 1;
                }
                .hero-title {
                  font-size: 42px;
                  font-weight: 800;
                  color: #ffffff;
                  margin: 0 0 12px;
                  letter-spacing: -1px;
                  position: relative;
                  z-index: 1;
                }
                .hero-subtitle {
                  font-size: 18px;
                  color: rgba(255, 255, 255, 0.95);
                  margin: 0;
                  font-weight: 500;
                  position: relative;
                  z-index: 1;
                }
                .badge {
                  display: inline-block;
                  background: rgba(255, 255, 255, 0.25);
                  backdrop-filter: blur(10px);
                  color: #ffffff;
                  padding: 8px 20px;
                  border-radius: 50px;
                  font-size: 14px;
                  font-weight: 600;
                  margin-top: 20px;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  position: relative;
                  z-index: 1;
                }
                .content-section {
                  padding: 50px 40px;
                }
                .greeting {
                  font-size: 28px;
                  font-weight: 700;
                  color: #111827;
                  margin: 0 0 20px;
                  text-align: center;
                }
                .description {
                  font-size: 17px;
                  color: #4b5563;
                  margin: 0 0 40px;
                  text-align: center;
                  line-height: 1.8;
                }
                .feature-grid {
                  display: grid;
                  gap: 20px;
                  margin: 40px 0;
                }
                .feature-card {
                  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                  border: 2px solid #86efac;
                  border-radius: 16px;
                  padding: 24px;
                  transition: transform 0.3s ease;
                }
                .feature-icon {
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 16px;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .feature-title {
                  font-size: 18px;
                  font-weight: 700;
                  color: #065f46;
                  margin: 0 0 8px;
                }
                .feature-description {
                  font-size: 15px;
                  color: #047857;
                  margin: 0;
                  line-height: 1.6;
                }
                .stats-container {
                  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                  border-radius: 20px;
                  padding: 40px 30px;
                  text-align: center;
                  margin: 40px 0;
                }
                .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 30px;
                  margin-top: 30px;
                }
                .stat-item {
                  text-align: center;
                }
                .stat-number {
                  font-size: 36px;
                  font-weight: 800;
                  color: #10b981;
                  margin: 0 0 8px;
                  line-height: 1;
                }
                .stat-label {
                  font-size: 14px;
                  color: #9ca3af;
                  margin: 0;
                  font-weight: 500;
                }
                .stats-title {
                  font-size: 24px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0;
                }
                .cta-section {
                  text-align: center;
                  margin: 50px 0;
                  padding: 40px 30px;
                  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
                  border-radius: 20px;
                  border: 2px solid #86efac;
                }
                .cta-title {
                  font-size: 26px;
                  font-weight: 700;
                  color: #065f46;
                  margin: 0 0 16px;
                }
                .cta-text {
                  font-size: 16px;
                  color: #047857;
                  margin: 0 0 32px;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  color: #ffffff;
                  padding: 18px 48px;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: 700;
                  font-size: 17px;
                  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
                  transition: all 0.3s ease;
                  border: none;
                }
                .button:hover {
                  box-shadow: 0 15px 35px rgba(16, 185, 129, 0.5);
                  transform: translateY(-2px);
                }
                .benefits-list {
                  list-style: none;
                  padding: 0;
                  margin: 30px 0;
                }
                .benefit-item {
                  display: flex;
                  align-items: flex-start;
                  padding: 16px 0;
                  border-bottom: 1px solid #e5e7eb;
                }
                .benefit-item:last-child {
                  border-bottom: none;
                }
                .check-icon {
                  width: 28px;
                  height: 28px;
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 16px;
                  flex-shrink: 0;
                  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
                }
                .benefit-text {
                  font-size: 16px;
                  color: #374151;
                  font-weight: 500;
                  line-height: 1.6;
                }
                .footer-section {
                  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                  padding: 40px;
                  text-align: center;
                  border-top: 3px solid #10b981;
                }
                .footer-logo-text {
                  font-size: 20px;
                  font-weight: 800;
                  color: #059669;
                  margin: 0 0 8px;
                }
                .footer-tagline {
                  font-size: 15px;
                  color: #6b7280;
                  margin: 0 0 24px;
                }
                .footer-contact {
                  font-size: 14px;
                  color: #6b7280;
                  margin: 24px 0 0;
                  line-height: 1.8;
                }
                .footer-contact a {
                  color: #059669;
                  text-decoration: none;
                  font-weight: 600;
                }
                .footer-contact a:hover {
                  text-decoration: underline;
                }
                .social-links {
                  margin: 24px 0;
                }
                .social-link {
                  display: inline-block;
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                  border-radius: 50%;
                  margin: 0 8px;
                  text-decoration: none;
                  color: #ffffff;
                  font-weight: bold;
                  line-height: 40px;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .unsubscribe-text {
                  font-size: 12px;
                  color: #9ca3af;
                  margin: 24px 0 0;
                  line-height: 1.6;
                }
                @media only screen and (max-width: 600px) {
                  .email-container {
                    margin: 0;
                    border-radius: 0;
                  }
                  .hero-section {
                    padding: 40px 24px;
                  }
                  .hero-title {
                    font-size: 32px;
                  }
                  .content-section {
                    padding: 40px 24px;
                  }
                  .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                  }
                  .cta-section {
                    padding: 30px 20px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <!-- Hero Section -->
                <div class="hero-section">
                  <div class="logo-container">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 22 17 7"></path>
                      <path d="m12 17-5 5-1.5-1.5L10 16"></path>
                      <path d="M9.5 12.5 12 15"></path>
                      <path d="m3.64 18.36.96.96"></path>
                      <path d="m4.17 15.11 3.54 3.54"></path>
                      <path d="m9.39 9.86 3.53 3.53"></path>
                      <path d="M17 2h5v5"></path>
                    </svg>
                  </div>
                  <h1 class="hero-title">Welcome to FarmCon!</h1>
                  <p class="hero-subtitle">Your Smart Farming Journey Begins Today</p>
                  <div class="badge">🎉 Successfully Subscribed</div>
                </div>

                <!-- Main Content -->
                <div class="content-section">
                  <h2 class="greeting">Hello, Future of Farming! 👋</h2>
                  <p class="description">
                    We're absolutely thrilled to welcome you to the FarmCon family! You've just joined <strong>10,000+ progressive farmers</strong> who are transforming their agricultural practices with smart technology and data-driven insights.
                  </p>

                  <!-- Feature Cards -->
                  <div class="feature-grid">
                    <div class="feature-card">
                      <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="12" y1="20" x2="12" y2="10"></line>
                          <line x1="18" y1="20" x2="18" y2="4"></line>
                          <line x1="6" y1="20" x2="6" y2="16"></line>
                        </svg>
                      </div>
                      <h3 class="feature-title">📊 Real-Time Market Intelligence</h3>
                      <p class="feature-description">Get instant access to mandi prices, crop trends, and market forecasts. Know exactly when and where to sell for maximum profits.</p>
                    </div>

                    <div class="feature-card">
                      <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <h3 class="feature-title">🌾 Expert Farming Insights</h3>
                      <p class="feature-description">Weekly tips from agricultural experts, seasonal guides, pest management strategies, and weather-based recommendations.</p>
                    </div>

                    <div class="feature-card">
                      <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                          <path d="M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                      <h3 class="feature-title">🎁 Exclusive Member Benefits</h3>
                      <p class="feature-description">Early access to new features, special discounts on supplies, priority support, and invitations to exclusive farming webinars.</p>
                    </div>
                  </div>

                  <!-- Success Stats -->
                  <div class="stats-container">
                    <h3 class="stats-title">Join the Success Story</h3>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <div class="stat-number">40%</div>
                        <div class="stat-label">Avg. Yield Increase</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number">60%</div>
                        <div class="stat-label">Profit Growth</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number">10K+</div>
                        <div class="stat-label">Active Farmers</div>
                      </div>
                    </div>
                  </div>

                  <!-- What to Expect -->
                  <h3 style="font-size: 24px; font-weight: 700; color: #111827; margin: 40px 0 24px; text-align: center;">
                    📬 What's Coming to Your Inbox
                  </h3>
                  <ul class="benefits-list">
                    <li class="benefit-item">
                      <div class="check-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="benefit-text">Weekly market price alerts and commodity trends</div>
                    </li>
                    <li class="benefit-item">
                      <div class="check-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="benefit-text">Seasonal farming guides and best practices</div>
                    </li>
                    <li class="benefit-item">
                      <div class="check-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="benefit-text">New platform features and product updates</div>
                    </li>
                    <li class="benefit-item">
                      <div class="check-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="benefit-text">Success stories from fellow farmers</div>
                    </li>
                    <li class="benefit-item">
                      <div class="check-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="benefit-text">Exclusive deals on seeds, equipment, and supplies</div>
                    </li>
                  </ul>

                  <!-- Call to Action -->
                  <div class="cta-section">
                    <h3 class="cta-title">🚀 Ready to Transform Your Farm?</h3>
                    <p class="cta-text">Create your free FarmCon account today and unlock all premium features!</p>
                    <a href="https://farmcon-cyan.vercel.app/" class="button" style="color: #ffffff;">
                      Get Started Now →
                    </a>
                  </div>

                  <p style="text-align: center; font-size: 15px; color: #6b7280; margin: 30px 0 0; line-height: 1.8;">
                    Have questions? Our support team is here to help you 24/7.<br>
                    Reply to this email or reach out at <a href="mailto:support@farmcon.in" style="color: #059669; text-decoration: none; font-weight: 600;">support@farmcon.in</a>
                  </p>
                </div>

                <!-- Footer -->
                <div class="footer-section">
                  <p class="footer-logo-text">🌾 FarmCon</p>
                  <p class="footer-tagline">Empowering Indian Farmers with Smart Technology</p>

                  <div class="social-links">
                    <a href="#" class="social-link">f</a>
                    <a href="#" class="social-link">𝕏</a>
                    <a href="#" class="social-link">in</a>
                    <a href="#" class="social-link">▶</a>
                  </div>

                  <div class="footer-contact">
                    <strong>📞 Toll-Free:</strong> +91 1800-XXX-XXXX<br>
                    <strong>📧 Email:</strong> <a href="mailto:support@farmcon.in">support@farmcon.in</a><br>
                    <strong>📍 Location:</strong> Bangalore, Karnataka, India
                  </div>

                  <p class="unsubscribe-text">
                    You're receiving this email because you subscribed to FarmCon's newsletter.<br>
                    Want to adjust your preferences? <a href="mailto:support@farmcon.in" style="color: #059669;">Contact us</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
🌾 WELCOME TO FARMCON!
Your Smart Farming Journey Begins Today

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello, Future of Farming! 👋

We're absolutely thrilled to welcome you to the FarmCon family! You've just joined 10,000+ progressive farmers who are transforming their agricultural practices with smart technology and data-driven insights.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 REAL-TIME MARKET INTELLIGENCE
Get instant access to mandi prices, crop trends, and market forecasts. Know exactly when and where to sell for maximum profits.

🌾 EXPERT FARMING INSIGHTS
Weekly tips from agricultural experts, seasonal guides, pest management strategies, and weather-based recommendations.

🎁 EXCLUSIVE MEMBER BENEFITS
Early access to new features, special discounts on supplies, priority support, and invitations to exclusive farming webinars.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JOIN THE SUCCESS STORY

• 40% Average Yield Increase
• 60% Profit Growth
• 10K+ Active Farmers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📬 WHAT'S COMING TO YOUR INBOX:

✓ Weekly market price alerts and commodity trends
✓ Seasonal farming guides and best practices
✓ New platform features and product updates
✓ Success stories from fellow farmers
✓ Exclusive deals on seeds, equipment, and supplies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 READY TO TRANSFORM YOUR FARM?

Create your free FarmCon account today and unlock all premium features!

Visit: https://farmcon-cyan.vercel.app/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Have questions? Our support team is here to help you 24/7.
Reply to this email or reach out at support@farmcon.in

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌾 FarmCon - Smart Farming Platform
Empowering Indian Farmers with Smart Technology

📞 Toll-Free: +91 1800-XXX-XXXX
📧 Email: support@farmcon.in
📍 Location: Bangalore, Karnataka, India

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're receiving this email because you subscribed to FarmCon's newsletter.
Want to adjust your preferences? Contact us at support@farmcon.in
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
