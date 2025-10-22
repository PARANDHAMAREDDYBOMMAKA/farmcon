import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { normalizePhoneNumber } from '@/lib/mobileOtp';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const key = `mobile_rate_limit:${normalizedPhone}`;

    // Delete the rate limit key
    await redis.del(key);

    return NextResponse.json(
      {
        message: 'Mobile rate limit cleared successfully',
        phoneNumber: normalizedPhone,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error clearing mobile rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limit' },
      { status: 500 }
    );
  }
}
