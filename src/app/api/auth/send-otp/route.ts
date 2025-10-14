import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, storeOTP, sendOTPEmail, verifyRecaptcha, checkRateLimit } from '@/lib/emailOtp';

export async function POST(request: NextRequest) {
  try {
    const { email, recaptchaToken } = await request.json();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (recaptchaToken && recaptchaToken !== 'skip') {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        console.warn('reCAPTCHA verification failed, but allowing request to proceed');
        
      }
    } else {
      console.warn('Skipping reCAPTCHA verification (token missing or debug mode)')
    }

    const rateLimit = await checkRateLimit(email);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime) : null;
      const minutesRemaining = resetTime
        ? Math.ceil((resetTime.getTime() - Date.now()) / 60000)
        : 60;

      return NextResponse.json(
        {
          error: `Too many OTP requests. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          resetTime: resetTime?.toISOString(),
          remainingAttempts: 0
        },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    await storeOTP(email, otp);

    await sendOTPEmail(email, otp);

    return NextResponse.json(
      {
        message: 'OTP sent successfully to your email',
        remainingAttempts: rateLimit.remainingAttempts
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    );
  }
}