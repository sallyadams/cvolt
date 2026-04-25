#!/bin/bash

# CVolt Deployment Script
# This script helps set up the project for deployment

echo "🚀 CVolt Deployment Setup"
echo "========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "📋 Copy .env.example to .env.local and fill in your values:"
    echo "   cp .env.example .env.local"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "ANTHROPIC_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.local || grep -q "^${var}=\"\"" .env.local; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing or empty environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Please set these in your .env.local file"
    exit 1
fi

echo "✅ Environment variables look good"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🔌 Checking database connection..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database setup complete"
else
    echo "❌ Database setup failed"
    echo "💡 Make sure your DATABASE_URL is correct"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "📝 Don't forget to set environment variables in Vercel dashboard!"
echo "   Go to: Project Settings → Environment Variables"