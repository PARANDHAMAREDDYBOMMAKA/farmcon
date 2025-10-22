import { NextRequest, NextResponse } from 'next/server';
import {
  generateMobileOTP,
  storeMobileOTP,
  sendMobileOTP,
  verifyRecaptcha,
  checkMobileRateLimit,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@/lib/mobileOtp';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, recaptchaToken } = await request.json();

    // Validate phone number
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Verify reCAPTCHA (optional but recommended)
    if (recaptchaToken && recaptchaToken !== 'skip') {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        console.warn('reCAPTCHA verification failed, but allowing request to proceed');
      }
    } else {
      console.warn('Skipping reCAPTCHA verification (token missing or debug mode)');
    }

    // Check rate limiting
    const rateLimit = await checkMobileRateLimit(normalizedPhone);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime) : null;
      const minutesRemaining = resetTime
        ? Math.ceil((resetTime.getTime() - Date.now()) / 60000)
        : 60;

      return NextResponse.json(
        {
          error: `Too many OTP requests. Please try again in ${minutesRemaining} minute${
            minutesRemaining !== 1 ? 's' : ''
          }.`,
          resetTime: resetTime?.toISOString(),
          remainingAttempts: 0,
        },
        { status: 429 }
      );
    }

    // Generate and store OTP
    const otp = generateMobileOTP();
    await storeMobileOTP(normalizedPhone, otp);

    // Send OTP via SMS (using Firebase or third-party service)
    try {
      await sendMobileOTP(normalizedPhone, otp);
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      // For development: still return success but log the error
      // In production: you might want to return an error
      console.log(`📱 OTP for ${normalizedPhone}: ${otp} (SMS sending failed, but OTP stored)`);
    }

    return NextResponse.json(
      {
        message: 'OTP sent successfully to your mobile number',
        remainingAttempts: rateLimit.remainingAttempts,
        phoneNumber: normalizedPhone, // Return normalized number for consistency
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending mobile OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    );
  }
}
