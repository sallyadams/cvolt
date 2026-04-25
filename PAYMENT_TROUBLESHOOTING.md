# Payment Troubleshooting Guide

## Issue: "Payment verification failed" on cvolt.vercel.app

### Quick Diagnosis

Run this command:
```bash
node test-payment.js
```

This will show exactly what's misconfigured.

### Common Issues & Solutions

#### 1. "STRIPE_SECRET_KEY is not set"

**Problem**: The secret key environment variable is missing on Vercel production

**Solution**:
1. Get your Stripe live secret key from https://dashboard.stripe.com/apikeys
2. Go to https://vercel.com/cvolt/settings/environment-variables
3. Add variable: `STRIPE_SECRET_KEY` = your live secret key (sk_live_...)
4. Make sure "Production" is checked
5. Click Save
6. Redeploy: `vercel --prod`

#### 2. "Invalid Stripe secret key"

**Problem**: You used a test key (sk_test_) instead of live key, or the key is corrupted

**Solution**:
- Verify you copied from https://dashboard.stripe.com/apikeys
- Keys must start with `sk_live_` not `sk_test_`
- Check for typos or missing characters
- Regenerate keys in Stripe if needed
- Verify in Vercel: echo $STRIPE_SECRET_KEY (should not be empty)

#### 3. "Stripe authentication failed"

**Problem**: The API key doesn't have permission to access checkout sessions

**Solution**:
- In Stripe dashboard, verify the API key has these permissions:
  - "Checkout Sessions" → Read & Write
  - "Customers" → Read
- If using restricted keys, check they're not limited to specific resources
- Try a full API key without restrictions

#### 4. Payment successful locally but fails on production

**Problem**: Environment variables set locally (.env.local) but not on Vercel

**Solution**:
```bash
# Pull environment from Vercel
vercel env pull

# This creates/updates .env.local
# Then verify with:
node test-payment.js
```

#### 5. "Session not found" error

**Problem**: Stripe session ID is invalid or has expired

**Solution**:
- Sessions expire after 24 hours
- Verify session ID is being passed correctly from frontend
- Check browser console for the session ID
- In Chrome DevTools Network tab, check the verify-payment request

#### 6. PDF downloads but payment shows as unverified

**Problem**: Payment gate logic isn't properly checking verification response

**Solution**:
- Clear browser cache and localStorage: `localStorage.clear()`
- Verify payment endpoint returns `{verified: true, payment_status: "paid"}`
- Check in browser console: look for "[build]" prefixed logs

## Testing Payment Flow

### Step 1: Create Test Checkout Session

```bash
curl -X POST https://cvolt.vercel.app/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{}'
```

Should return:
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### Step 2: Verify Session

```bash
curl "https://cvolt.vercel.app/api/verify-payment?session_id=cs_test_..."
```

Should return:
```json
{
  "verified": true,
  "payment_status": "paid"
}
```

### Step 3: Test in Browser

1. Visit https://cvolt.vercel.app/build
2. Click "Download PDF — $4.99"
3. Use card: 4242 4242 4242 4242
4. Any future expiry date, any 3-digit CVC
5. Complete payment
6. Should redirect to /build?payment=success&session_id=...
7. Should show "✅ Payment successful, PDF unlocked"

## Health Check Endpoint

Visit: https://cvolt.vercel.app/api/health

This shows the status of all systems:
- Database connection
- Anthropic API
- Stripe configuration
- Auth configuration

All should show "✓" for production deployment.

## Debug Logging

The payment flow includes detailed logging. In browser console (F12):

- `[build] Initiating payment...` - User clicked download
- `[build] Stripe checkout URL: ...` - Got checkout session
- `[build] Payment returned with session_id: ...` - Returned from Stripe
- `[build] Payment verification response: ...` - API response
- `[build] Payment verified! Unlocking PDF...` - Success

If you don't see these logs in order, something failed earlier in the flow.

## Additional Resources

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout Integration](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## Still Having Issues?

1. Check [QUICK_FIX.md](QUICK_FIX.md) for step-by-step setup
2. Run `node test-payment.js` for comprehensive diagnostics
3. Check Vercel deployment logs: https://vercel.com/cvolt/deployments
4. Look for "STRIPE_SECRET_KEY" in Stripe dashboard API keys page
