import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import { Redis } from '@upstash/redis';
import { otpEmail } from './email/templates';

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

  if (!storedOTP) return false;
  const storedOTPStr = String(storedOTP).trim();
  const inputOTPStr = String(otp).trim();
  if (storedOTPStr !== inputOTPStr) return false;

  await redis.del(key);
  return true;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const transporter = createTransporter();
  const template = otpEmail({ otp, minutes: 5 });

  await transporter.sendMail({
    from: `"FarmCon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  try {
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return false;
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    return data.success && data.score >= 0.3;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

export const checkRateLimit = async (
  email: string,
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: number }> => {
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
      resetTime: ttl > 0 ? Date.now() + ttl * 1000 : undefined,
    };
  }

  const newCount = currentCount + 1;
  await redis.set(key, newCount, { ex: windowSeconds });

  return { allowed: true, remainingAttempts: maxAttempts - newCount };
};

export const getRateLimitInfo = async (
  email: string,
): Promise<{ remainingAttempts: number; resetTime?: number }> => {
  const key = `rate_limit:${email}`;
  const maxAttempts = 20;

  const count = await redis.get(key);
  const currentCount = count ? parseInt(count as string) : 0;
  const ttl = await redis.ttl(key);

  return {
    remainingAttempts: Math.max(0, maxAttempts - currentCount),
    resetTime: ttl > 0 ? Date.now() + ttl * 1000 : undefined,
  };
};
