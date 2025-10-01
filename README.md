# 🌾 FarmCon - Farm Connect Platform

A comprehensive digital platform connecting farmers, suppliers, and buyers. Built with Next.js 15, TypeScript, and modern web technologies.

---

## 🚀 Features

### Core Features
- ✅ **AI Chatbot** - Farming assistant with crop recommendations
- ✅ **Authentication** - Email OTP, Phone OTP, Social login
- ✅ **Real-time Notifications** - Socket.io powered live updates
- ✅ **Advanced Search** - MeiliSearch integration
- ✅ **Image Optimization** - Sharp for 60-80% size reduction
- ✅ **Analytics** - PostHog for user insights
- ✅ **Error Tracking** - Sentry integration
- ✅ **Caching** - Upstash Redis for performance

### Marketplace
- 🛒 Product catalog with categories
- 🌱 Crop listings & management
- 🚜 Equipment rental marketplace
- 💳 Stripe payment integration
- 📦 Order management & tracking
- 📊 Supplier dashboard

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Auth** | Supabase Auth |
| **Caching** | Upstash Redis |
| **Payments** | Stripe |
| **Search** | MeiliSearch |
| **Real-time** | Socket.io |
| **Analytics** | PostHog |
| **Monitoring** | Sentry |
| **Images** | Cloudinary + Sharp |
| **Email** | Nodemailer (Gmail) |

---

## 📦 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file (see `.env` template in project)

Required variables:
```env
# Database
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Email
EMAIL_USER=
EMAIL_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Optional (for advanced features):
```env
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# MeiliSearch
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
farmcon/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Auth endpoints
│   │   │   ├── cart/             # Cart management
│   │   │   ├── orders/           # Order processing
│   │   │   ├── products/         # Product CRUD
│   │   │   ├── search/           # MeiliSearch API
│   │   │   └── socket/           # Socket.io server
│   │   ├── auth/                 # Auth pages
│   │   │   ├── email-otp/        # Email OTP signin
│   │   │   ├── verify-otp/       # OTP verification
│   │   │   ├── signin/           # Sign in
│   │   │   └── signup/           # Sign up
│   │   └── dashboard/            # Dashboard pages
│   │       ├── cart/             # Shopping cart
│   │       ├── orders/           # Order history
│   │       ├── products/         # Product management
│   │       ├── supplies/         # Browse supplies
│   │       └── profile/          # User profile
│   ├── components/               # React Components
│   │   ├── chatbot/              # AI Chatbot
│   │   ├── providers/            # Context providers
│   │   ├── search/               # Search components
│   │   └── notifications/        # Notification system
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication
│   │   └── useSocket.ts          # Real-time hooks
│   ├── lib/                      # Utilities & Config
│   │   ├── analytics.ts          # PostHog helper
│   │   ├── emailOtp.ts           # OTP management
│   │   ├── meilisearch.ts        # Search client
│   │   ├── prisma.ts             # Prisma client
│   │   ├── redis.ts              # Redis cache
│   │   ├── socket.ts             # Socket.io client
│   │   └── stripe.ts             # Stripe config
│   └── types/                    # TypeScript types
├── prisma/                       # Prisma schema
├── sentry.*.config.ts            # Sentry configs
└── .env                          # Environment variables
```

---

## 🎯 Key Features Documentation

### 1. AI Chatbot 🤖
- **Location**: Floating button (bottom-right on all pages)
- **Features**:
  - Product browsing help
  - Crop recommendations by season
  - Equipment rental info
  - Order tracking
  - FAQs

**Customize**: Edit `src/components/chatbot/FarmConChatbot.tsx`

### 2. Real-time Notifications ⚡
Using Socket.io for instant updates:

```typescript
import { useNotifications } from '@/hooks/useSocket'

// In your component
useNotifications(userId, (notification) => {
  toast.success(notification.message)
})
```

### 3. Advanced Search 🔍
MeiliSearch for fast, typo-tolerant search:

```typescript
// Search API
const results = await fetch(
  '/api/search?q=fertilizer&index=products'
)
```

### 4. Image Optimization 🖼️
Sharp reduces image sizes by 60-80%:

```tsx
import OptimizedImage from '@/components/OptimizedImage'

<OptimizedImage
  src="/image.jpg"
  width={500}
  height={500}
  quality={80}
  format="webp"
/>
```

### 5. Analytics 📊
PostHog tracks user behavior:

```typescript
import analytics from '@/lib/analytics'

// Track events
analytics.productViewed(id, name, price)
analytics.addToCart(id, name, qty, price)
analytics.purchaseCompleted(orderId, total, items, method)
```

### 6. Caching 💾
Redis caches API responses:

```typescript
import { cache, CacheKeys } from '@/lib/redis'

// Get from cache
const data = await cache.get(CacheKeys.products())

// Set cache
await cache.set(CacheKeys.products(), data, 300) // 5 min TTL
```

---

## 🔐 Authentication Flow

1. **Email OTP**:
   - User enters email
   - OTP sent via email (20 attempts/hour)
   - User verifies OTP
   - Auto sign-in

2. **Regular Sign Up**:
   - Email + Password
   - Supabase Auth
   - Role selection (Farmer/Supplier/Buyer)

3. **Rate Limiting**:
   - 20 OTP requests per hour per email
   - Redis-based tracking
   - Detailed error messages

---

## 💳 Payment Integration

### Stripe Checkout
```typescript
// Initiate checkout
const response = await fetch('/api/cart/checkout', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    cartItems,
    paymentMethod: 'stripe'
  })
})

// Redirect to Stripe
window.location.href = data.redirectUrl
```

### Cash on Delivery
```typescript
// Direct order creation
const response = await fetch('/api/cart/checkout', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    cartItems,
    paymentMethod: 'cod'
  })
})
```

---

## 🔔 Notifications System

### Database Schema
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'order', 'delivery', 'payment'
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Create Notification
```typescript
await prisma.notification.create({
  data: {
    userId: 'user-123',
    title: 'New Order Received',
    message: 'You have a new order #12345',
    type: 'order',
    actionUrl: '/dashboard/orders',
  }
})
```

### Real-time Delivery
```typescript
// Server-side (API route)
io.to(`user:${userId}`).emit('notification:new', {
  title: 'Order Shipped',
  message: 'Your order is on the way!'
})

// Client-side (React component)
useNotifications(userId, (notification) => {
  // Show toast/notification
})
```

---

## 🎨 UI Components

### Notification Bell
```tsx
import NotificationBell from '@/components/notifications/NotificationBell'

<NotificationBell userId={user.id} />
```

Features:
- Unread count badge
- Real-time updates
- Dropdown with recent notifications
- Mark as read functionality

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Environment Variables
Add all `.env` variables to Vercel dashboard

### Database
- Supabase (managed PostgreSQL)
- Automatic backups
- Row Level Security (RLS)

### Redis
- Upstash (serverless Redis)
- Auto-scaling
- Pay-as-you-go

---

## 📊 Performance Optimizations

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| Image Size | 1-3 MB | 200-500 KB | **60-80%** |
| API Response | No cache | Cached | **10x faster** |
| Search | SQL | MeiliSearch | **50ms vs 500ms** |

### Caching Strategy
- Products: 5 minutes
- Orders: 2 minutes
- Cart: 1 minute
- Categories: 10 minutes
- Crops: 5 minutes

---

## 🐛 Debugging

### Check PostHog
```javascript
// Browser console should show:
✅ PostHog initialized successfully
📊 PostHog pageview: /dashboard
```

### Check Socket.io
```javascript
// Browser console should show:
✅ Socket.IO connected
```

### Check Redis
```bash
# Test Redis connection
curl https://your-redis-url/ping
```

### Check MeiliSearch
```bash
# Health check
curl https://your-meilisearch-url/health

# Sync data
curl -X POST http://localhost:3000/api/search/sync?index=all
```

---

## 🔧 Common Tasks

### Add New Product Category
```typescript
// API: /api/categories
await fetch('/api/categories', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Organic Seeds',
    description: 'Certified organic seeds'
  })
})
```

### Sync Search Index
```bash
curl -X POST http://localhost:3000/api/search/sync?index=products
```

### Clear Cache
```typescript
import { cache } from '@/lib/redis'
await cache.invalidatePattern('farmcon:products:*')
```

---

## 📝 Environment Variables Reference

See `.env` file for complete list with descriptions.

Required:
- Database (Supabase/PostgreSQL)
- Redis (Upstash)
- Stripe (Payments)
- Email (Gmail)
- Cloudinary (Images)

Optional:
- PostHog (Analytics)
- MeiliSearch (Search)
- Sentry (Error tracking)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Docs**: This README
- **Email**: support@farmcon.com

---

## 🎉 Acknowledgments

Built with:
- Next.js
- Prisma
- Supabase
- Stripe
- PostHog
- MeiliSearch
- And many more amazing open-source projects!

---

**Made with ❤️ for Indian Farmers** 🌾
