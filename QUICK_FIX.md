# Quick Fix: Enable Stripe Payments on Vercel

## Problem
Payment verification is failing because **Stripe environment variables are not configured on Vercel production**.

## Solution (5 minutes)

### Step 1: Get Your Stripe Keys
1. Open https://dashboard.stripe.com/apikeys
2. Copy these values (replace with your actual keys):
   - **Live Secret Key**: From the "Secret key" field (starts with `sk_live_`)
   - **Live Publishable Key**: From the "Publishable key" field (starts with `pk_live_`)
   - **Webhook Secret**: From https://dashboard.stripe.com/webhooks → Select your endpoint → copy "Signing secret" (starts with `whsec_`)

### Step 2: Add to Vercel
1. Go to https://vercel.com/cvolt/settings/environment-variables
2. Click "Add New"
3. Add these 4 variables:

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | Your live secret key (sk_live_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your live publishable key (pk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Your webhook signing secret (whsec_...) |
| `STRIPE_PRICE_CENTS` | `499` |

4. Make sure **Production** is checked for each variable

### Step 3: Redeploy
```bash
vercel --prod
```

### Step 4: Test
Run the payment test:
```bash
node test-payment.js
```

Expected output:
```
✅ Configuration Status: Ready for production
```

### Step 5: Verify End-to-End
1. Visit https://cvolt.vercel.app/build
2. Click "Download PDF — $4.99"
3. Use test card: `4242 4242 4242 4242`
4. Should see: "✅ Payment successful, PDF unlocked"

## Troubleshooting

**If test still shows missing variables:**
- Refresh the page
- Run `vercel env pull` to sync local
- Redeploy with `vercel --prod`

**If payment fails after configuration:**
- Check Stripe API key is from "Live" (not "Test")
- Verify no typos in webhook secret
- Check that keys have correct permissions in Stripe dashboard
