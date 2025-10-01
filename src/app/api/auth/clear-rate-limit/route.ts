import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Clear rate limit
    await redis.del(`rate_limit:${email}`);

    // Also clear any existing OTP
    await redis.del(`otp:${email}`);

    return NextResponse.json(
      { message: 'Rate limit and OTP cleared successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error clearing rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limit' },
      { status: 500 }
    );
  }
}