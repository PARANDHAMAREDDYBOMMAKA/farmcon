# FarmCon - Empowering Indian Farmers

A comprehensive digital platform designed specifically for Indian farmers to manage crops, track market prices, buy agricultural supplies, and sell produce directly to consumers.

## Features

- **Landing Page**: Modern, farmer-focused landing page showcasing platform benefits
- **Authentication System**: 
  - Email/password authentication
  - Phone number authentication with OTP verification
  - Email verification system
- **Dashboard**: Personalized farmer dashboard with quick stats and actions
- **Crop Management**: Track crops from planting to harvest
- **Market Integration**: Real-time price tracking from local mandis
- **Direct Sales**: Connect farmers directly with consumers
- **Supply Chain**: Buy seeds, fertilizers, and equipment from verified suppliers

## Tech Stack

- **Frontend & Backend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Caching**: Upstash Redis
- **Payments**: Stripe
- **Deployment**: Vercel (recommended)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Upstash Redis
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # UI components
├── lib/                  # Configuration and utilities
│   ├── supabase.ts       # Supabase client
│   ├── stripe.ts         # Stripe configuration
│   └── redis.ts          # Redis client
└── types/                # TypeScript type definitions
```

## Current Pages

1. **Landing Page** (`/`) - Hero section with features overview
2. **Sign Up** (`/auth/signup`) - User registration with email verification
3. **Sign In** (`/auth/signin`) - Email/password login
4. **Phone Sign In** (`/auth/phone-signin`) - OTP-based phone authentication
5. **Email Verification** (`/auth/verify-email`) - Email confirmation flow
6. **Dashboard** (`/dashboard`) - Farmer's main control panel

## Upcoming Features

- Crop management system
- Weather integration
- Market price tracking
- Equipment rental marketplace
- Direct sales platform
- AI-powered recommendations
- Mobile app (React Native)

## Database Setup

The application expects a Supabase database with the following table structure:

```sql
-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade,
  email text not null,
  phone text,
  full_name text,
  farm_location text,
  farm_size decimal,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.



read the entire codebase and now fix the notifications to get the notifications properly\
  \
  this si how the data will be\
  \
  [{"idx":0,"id":"31903c26-1bbb-4a00-9c2e-a6e7ffeade08","user_id":"8d367396-af97-42b1-8c7c-f90e9761a518","title":"New Order 
  Received","message":"You have received a new order #ee43a6cd for 
  ₹1999999.44","type":"order","is_read":false,"action_url":"/dashboard/orders","created_at":"2025-09-22 05:05:50.855"}]\
  \
  in the notifications table and also for the delivery maanagement also use the notifications table to send and recieve and also now 
  complete the proper supplier dashboard
