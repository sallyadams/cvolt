# CVolt – AI CV Builder

## 🚀 Overview
CVolt is an AI-powered CV builder designed to help professionals create modern, optimized resumes in seconds.

It combines simplicity, speed, and clean design to deliver a seamless experience.

---

## ✨ Features
- AI-powered CV generation
- Clean and modern UI
- Fast performance with Next.js
- Responsive design (mobile + desktop)
- Ready for SaaS monetization

---

## 🛠 Tech Stack
- Next.js 16
- Tailwind CSS
- TypeScript
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)
- NextAuth.js
- Stripe (payments)
- Anthropic AI
- Vercel (deployment)

---

## 🌐 Live Demo
https://cvolt.vercel.app

---

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel account
- Stripe account
- Anthropic API key

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Database (PostgreSQL required for production)
DATABASE_URL="postgresql://username:password@hostname:5432/database"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Anthropic AI
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_... or rk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_CENTS="499"

# Stripe Pricing IDs
STRIPE_PRICE_STARTER="price_starter_id"
STRIPE_PRICE_PRO="price_pro_id"
STRIPE_PRICE_PREMIUM="price_premium_id"
```

### Vercel Deployment

1. **Connect Repository:**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - **Important:** Use PostgreSQL URL for `DATABASE_URL` in production

3. **Database Setup:**
   - For production, use a cloud database (PostgreSQL recommended)
   - Update `DATABASE_URL` in Vercel environment variables
   - Run migrations: `npx prisma migrate deploy`

### Local Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

---

## 📦 Status
🚧 In development – actively improving features

---

## 🎯 Vision
To build a smart CV system that helps users stand out and get hired faster using AI.

---

## 👩‍💻 Author
Salamat Adams
Founder – CowLady Consulting
Data & AI Strategist
