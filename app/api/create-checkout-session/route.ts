import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * Build the base URL that Stripe will redirect back to.
 * Browsers don't always send the Origin header for same-origin fetch requests,
 * so we fall through a reliable chain instead of relying on it alone.
 */
function getBaseUrl(req: NextRequest): string {
  // 1. Explicit override — set NEXT_PUBLIC_APP_URL in Vercel env vars for custom domains
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  // 2. x-forwarded-host — Vercel and most reverse-proxies set this reliably
  const fwdHost = req.headers.get("x-forwarded-host");
  const fwdProto = req.headers.get("x-forwarded-proto") ?? "https";
  if (fwdHost) {
    return `${fwdProto}://${fwdHost}`;
  }
  // 3. VERCEL_URL — automatically injected by Vercel on every deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 4. Origin header — browsers may or may not send this for same-origin requests
  const origin = req.headers.get("origin");
  if (origin) return origin;
  // 5. Host header — always present, works locally
  const host = req.headers.get("host");
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not set. Add it to Vercel environment variables (or .env.local locally) and redeploy." },
      { status: 500 }
    );
  }

  if (secretKey.startsWith("pk_")) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is a publishable key (pk_). Use the secret key (sk_) or a restricted key (rk_) from your Stripe dashboard." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  const baseUrl = getBaseUrl(req);
  const priceInCents = Number(process.env.STRIPE_PRICE_CENTS ?? "499");

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "CVolt — Premium CV PDF",
              description: "Download your AI-generated, recruiter-ready CV",
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // {CHECKOUT_SESSION_ID} is a Stripe template literal — Stripe fills it in at redirect time
      success_url: `${baseUrl}/build?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/build?payment=cancelled`,
      metadata: { product: "cv_download" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session]", err);

    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json(
        { error: "Stripe rejected the API key (401). Check STRIPE_SECRET_KEY in your Vercel environment variables." },
        { status: 500 }
      );
    }

    if (err instanceof Stripe.errors.StripePermissionError) {
      return NextResponse.json(
        { error: "Stripe permission denied. Your restricted key (rk_) needs 'Checkout Sessions: Write' permission." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout creation failed" },
      { status: 500 }
    );
  }
}
