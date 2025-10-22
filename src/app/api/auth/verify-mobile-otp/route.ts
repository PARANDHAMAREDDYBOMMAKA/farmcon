import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileOTP, normalizePhoneNumber, isValidPhoneNumber } from '@/lib/mobileOtp';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, firebaseUid } = await request.json();

    // Validate inputs
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Check if this is Firebase-verified OTP or custom OTP
    if (otp === 'firebase-verified' && firebaseUid) {
      // Firebase already verified the OTP, skip Redis verification
      console.log('Firebase verified OTP for:', normalizedPhone);
    } else {
      // Verify OTP from Redis (custom OTP flow)
      if (otp.length !== 6) {
        return NextResponse.json(
          { error: 'Invalid OTP format. OTP must be 6 digits.' },
          { status: 400 }
        );
      }

      const isValid = await verifyMobileOTP(normalizedPhone, otp);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please request a new OTP.' },
          { status: 400 }
        );
      }
    }

    // OTP is valid - now check if user exists in the database
    // Query the users table to find user with this phone number
    const { data: existingUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, phone_number, user_type')
      .eq('phone_number', normalizedPhone)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      // User doesn't exist - they need to sign up first
      return NextResponse.json(
        {
          error: 'No account found with this phone number. Please sign up first.',
          requiresSignup: true,
          phoneNumber: normalizedPhone,
        },
        { status: 404 }
      );
    }

    // User exists - sign them in
    // Use their email to sign in with Supabase
    const mobileEmail = existingUser.email || `${normalizedPhone.replace('+', '')}@farmcon.mobile`;
    const password = `${normalizedPhone}_farmcon_mobile_verified_2024`;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: mobileEmail,
      password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return NextResponse.json(
        { error: 'Failed to sign in. Please try again or use password login.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        user: signInData.user,
        session: signInData.session,
        phoneNumber: normalizedPhone,
        userType: existingUser.user_type,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying mobile OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
