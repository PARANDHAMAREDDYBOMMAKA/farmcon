import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const generateOTP = (): string => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const key = `otp:${email}`;
  await redis.set(key, otp, { ex: 300 }); 
};

export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const key = `otp:${email}`;
  const storedOTP = await redis.get(key);

  console.log('OTP Verification Debug:', {
    email,
    inputOTP: otp,
    storedOTP,
    storedOTPType: typeof storedOTP,
    match: storedOTP === otp,
    stringMatch: String(storedOTP) === String(otp)
  });

  if (!storedOTP) {
    console.log('No OTP found for email:', email);
    return false;
  }

  const storedOTPStr = String(storedOTP).trim();
  const inputOTPStr = String(otp).trim();

  if (storedOTPStr !== inputOTPStr) {
    console.log('OTP mismatch:', { storedOTPStr, inputOTPStr });
    return false;
  }

  await redis.del(key);
  return true;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"FarmCon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🌾 Your FarmCon Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FarmCon Verification Code</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 36px;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 10px;
              letter-spacing: -0.5px;
            }
            .header-subtitle {
              color: #d1fae5;
              font-size: 14px;
              font-weight: 500;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 22px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 16px;
            }
            .message {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .otp-container {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #16a34a;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
              box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
            }
            .otp-label {
              font-size: 14px;
              color: #15803d;
              font-weight: 600;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .otp-code {
              font-size: 42px;
              font-weight: 800;
              letter-spacing: 12px;
              color: #16a34a;
              margin: 10px 0;
              font-family: 'Courier New', monospace;
              text-shadow: 0 2px 4px rgba(22, 163, 74, 0.1);
            }
            .timer {
              display: inline-block;
              margin-top: 16px;
              padding: 8px 16px;
              background-color: #fef3c7;
              border-radius: 20px;
              font-size: 13px;
              color: #92400e;
              font-weight: 600;
            }
            .info-box {
              background-color: #f9fafb;
              border-left: 4px solid #16a34a;
              border-radius: 6px;
              padding: 16px 20px;
              margin: 24px 0;
            }
            .info-title {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 8px;
            }
            .info-text {
              font-size: 14px;
              color: #6b7280;
              line-height: 1.6;
            }
            .warning-box {
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border: 1px solid #fca5a5;
              border-radius: 8px;
              padding: 16px 20px;
              margin-top: 24px;
              display: flex;
              align-items: start;
              gap: 12px;
            }
            .warning-icon {
              font-size: 20px;
              flex-shrink: 0;
            }
            .warning-text {
              font-size: 13px;
              color: #991b1b;
              line-height: 1.6;
            }
            .footer {
              background-color: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .footer-link {
              color: #16a34a;
              text-decoration: none;
              font-weight: 600;
            }
            .footer-link:hover {
              text-decoration: underline;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 24px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">🌾 FarmCon</div>
              <div class="header-subtitle">Farm Connect Platform</div>
            </div>

            <div class="content">
              <div class="greeting">Verify Your Email</div>
              <p class="message">
                You've requested to sign in to your FarmCon account. Use the verification code below to complete your sign-in:
              </p>

              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="timer">⏱️ Expires in 5 minutes</div>
              </div>

              <div class="info-box">
                <div class="info-title">How to use this code:</div>
                <div class="info-text">
                  1. Return to the FarmCon sign-in page<br>
                  2. Enter this 6-digit code in the verification field<br>
                  3. Click verify to access your account
                </div>
              </div>

              <div class="divider"></div>

              <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                  <strong>Security Notice:</strong> Never share this code with anyone. FarmCon staff will never ask for your verification code. If you didn't request this code, please ignore this email or contact support if you have concerns.
                </div>
              </div>
            </div>

            <div class="footer">
              <p class="footer-text">
                This is an automated message from <strong>FarmCon</strong>
              </p>
              <p class="footer-text">
                Need help? <a href="#" class="footer-link">Contact Support</a>
              </p>
              <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
                © ${new Date().getFullYear()} FarmCon. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your FarmCon verification code is: ${otp}. This code will expire in 5 minutes. Never share this code with anyone.`,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  try {
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return false;
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    console.log('reCAPTCHA verification result:', {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      error_codes: data['error-codes']
    });

    return data.success && data.score >= 0.3;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

export const checkRateLimit = async (email: string): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: number }> => {
  const key = `rate_limit:${email}`;
  const maxAttempts = 20;
  const windowSeconds = 3600; 

  const count = await redis.get(key);
  const currentCount = count ? parseInt(count as string) : 0;

  if (currentCount >= maxAttempts) {
    
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : undefined
    };
  }

  const newCount = currentCount + 1;
  await redis.set(key, newCount, { ex: windowSeconds });

  return {
    allowed: true,
    remainingAttempts: maxAttempts - newCount
  };
};

export const getRateLimitInfo = async (email: string): Promise<{ remainingAttempts: number; resetTime?: number }> => {
  const key = `rate_limit:${email}`;
  const maxAttempts = 20;

  const count = await redis.get(key);
  const currentCount = count ? parseInt(count as string) : 0;
  const ttl = await redis.ttl(key);

  return {
    remainingAttempts: Math.max(0, maxAttempts - currentCount),
    resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : undefined
  };
};