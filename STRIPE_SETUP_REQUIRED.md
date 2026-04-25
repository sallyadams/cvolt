# Stripe Setup Required for CVolt

This document explains what needs to be configured to make payments work on production.

## Current Status

✅ **Code**: Payment verification system is fully implemented and tested locally
❌ **Configuration**: Stripe environment variables missing on Vercel production

## What's Needed

### Environment Variables

The app requires these Stripe environment variables on **production** to verify payments:

1. **STRIPE_SECRET_KEY** (sk_live_...)
   - Used server-side to verify payment sessions
   - Must be "Live" mode, not "Test" mode
   - Location: https://dashboard.stripe.com/apikeys

2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** (pk_live_...)
   - Used client-side to create Checkout sessions
   - Must be "Live" mode
   - Location: https://dashboard.stripe.com/apikeys

3. **STRIPE_WEBHOOK_SECRET** (whsec_...)
   - Used to verify webhook signatures (future)
   - Location: https://dashboard.stripe.com/webhooks

4. **STRIPE_PRICE_CENTS** (optional)
   - Price for PDF download in cents (default: 499 = $4.99)

### How to Add to Vercel

1. Navigate to: https://vercel.com/[your-project]/settings/environment-variables
2. Click "Add New" for each variable
3. Set scope to "Production"
4. Click "Save"

### Deployment

After adding variables:
```bash
vercel --prod
```

This triggers a rebuild with the new environment variables loaded.

## Verification

### Automated Test
```bash
node test-payment.js
```

### Manual Test
1. Visit: https://[your-project].vercel.app/api/payment-test
2. Should show all checks passing

### End-to-End Test
1. Go to: https://[your-project].vercel.app/build
2. Generate a CV
3. Click "Download PDF — $4.99"
4. Complete payment with test card: 4242 4242 4242 4242
5. Should see success and PDF downloads

## Code Implementation Details

### Payment Creation Flow
**File**: [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)
- Uses `STRIPE_SECRET_KEY` to create Stripe checkout session
- Returns checkout URL and session ID
- Called from frontend when user clicks "Download PDF"

### Payment Verification Flow
**File**: [app/api/verify-payment/route.ts](app/api/verify-payment/route.ts)
- Uses `STRIPE_SECRET_KEY` to verify session payment status
- Checks that `payment_status === "paid"`
- Returns verification result to frontend

### Frontend Integration
**File**: [app/build/page.tsx](app/build/page.tsx)
- Initiates payment: `fetch("/api/create-checkout-session")`
- Redirects to Stripe Checkout at returned URL
- After payment, verifies: `fetch("/api/verify-payment?session_id=...")`
- Unlocks PDF download when payment verified

## Troubleshooting

### "Payment verification failed" Error
**Cause**: `STRIPE_SECRET_KEY` not set or incorrect
**Solution**: Add correct live secret key to Vercel environment variables

### Payments work locally but not in production
**Cause**: Environment variables not propagated to production
**Solution**: 
1. Verify variables are set for "Production" scope in Vercel
2. Run `vercel --prod` to redeploy
3. Check: https://[project].vercel.app/api/health

### Test shows "Stripe connection failed"
**Cause**: Secret key missing or invalid
**Solution**:
1. Verify you're using "Live" keys, not "Test" keys
2. Check for typos in environment variable
3. Regenerate keys in Stripe dashboard if needed

## Security Notes

- **STRIPE_SECRET_KEY** must be kept secret (server-side only)
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** is safe to expose (client-side)
- Never commit actual keys to git
- Vercel automatically masks values in logs
- Use restricted keys in production for minimal permissions
