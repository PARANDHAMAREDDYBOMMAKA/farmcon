// Mobile OTP using Firebase Authentication
import { Redis } from '@upstash/redis';
import otpGenerator from 'otp-generator';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Generate a 6-digit OTP
 */
export const generateMobileOTP = (): string => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

/**
 * Store mobile OTP in Redis with 5-minute expiration
 */
export const storeMobileOTP = async (phoneNumber: string, otp: string): Promise<void> => {
  const key = `mobile_otp:${phoneNumber}`;
  await redis.set(key, otp, { ex: 300 });
};

/**
 * Verify mobile OTP from Redis
 */
export const verifyMobileOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const key = `mobile_otp:${phoneNumber}`;
  const storedOTP = await redis.get(key);

  console.log('Mobile OTP Verification Debug:', {
    phoneNumber,
    inputOTP: otp,
    storedOTP,
    storedOTPType: typeof storedOTP,
    match: storedOTP === otp,
  });

  if (!storedOTP) {
    console.log('No OTP found for phone number:', phoneNumber);
    return false;
  }

  const storedOTPStr = String(storedOTP).trim();
  const inputOTPStr = String(otp).trim();

  if (storedOTPStr !== inputOTPStr) {
    console.log('OTP mismatch:', { storedOTPStr, inputOTPStr });
    return false;
  }

  // Delete OTP after successful verification
  await redis.del(key);
  return true;
};

export const sendMobileOTP = async (phoneNumber: string, otp: string): Promise<void> => {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const message = `${otp} is your FarmCon verification code. Valid for 5 minutes. Do not share this code with anyone for security reasons. - FarmCon Team`;

    console.log(`📱 SMS OTP for ${normalizedPhone}: ${otp}`);
    console.log(`Message: ${message}`);

  } catch (error) {
    console.error('Error sending mobile OTP:', error);
    throw new Error('Failed to send mobile OTP');
  }
};

/**
 * Normalize phone number to E.164 format
 * Assumes Indian phone numbers if no country code is provided
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If the number doesn't start with country code, assume India (+91)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  // Add '+' prefix for E.164 format
  return '+' + cleaned;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check if it's a valid 10-digit Indian number or E.164 format
  const isIndianNumber = /^[6-9]\d{9}$/.test(cleaned);
  const isE164Format = /^\+?91[6-9]\d{9}$/.test(phoneNumber);
  const isInternational = /^\+\d{10,15}$/.test(phoneNumber);

  return isIndianNumber || isE164Format || isInternational;
};

export const checkMobileRateLimit = async (
  phoneNumber: string
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: number }> => {
  const key = `mobile_rate_limit:${phoneNumber}`;
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

  return {
    allowed: true,
    remainingAttempts: maxAttempts - newCount,
  };
};


export const getMobileRateLimitInfo = async (
  phoneNumber: string
): Promise<{ remainingAttempts: number; resetTime?: number }> => {
  const key = `mobile_rate_limit:${phoneNumber}`;
  const maxAttempts = 20;

  const count = await redis.get(key);
  const currentCount = count ? parseInt(count as string) : 0;
  const ttl = await redis.ttl(key);

  return {
    remainingAttempts: Math.max(0, maxAttempts - currentCount),
    resetTime: ttl > 0 ? Date.now() + ttl * 1000 : undefined,
  };
};

/**
 * Verify reCAPTCHA token (same as email OTP)
 */
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
      error_codes: data['error-codes'],
    });

    return data.success && data.score >= 0.3;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};
