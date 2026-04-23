import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 15;

// Always returns HTTP 200 — the client reads `data.verified` to decide whether to unlock the PDF.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: "Missing session_id.",
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    console.error("[verify-payment] STRIPE_SECRET_KEY is not set");
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: "STRIPE_SECRET_KEY is not set. Add it to your Vercel environment variables and redeploy.",
    });
  }

  if (secretKey.startsWith("pk_")) {
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: "STRIPE_SECRET_KEY is a publishable key (pk_). Use the secret key (sk_) or a restricted key (rk_).",
    });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  try {
    console.log("[verify-payment] retrieving session:", sessionId.slice(0, 25) + "…");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified = session.payment_status === "paid";

    console.log("[verify-payment] payment_status:", session.payment_status, "verified:", verified);

    return NextResponse.json({
      verified,
      payment_status: session.payment_status,
    });
  } catch (err) {
    console.error("[verify-payment] Stripe error:", err);

    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: "Stripe rejected the API key (401). Check STRIPE_SECRET_KEY in your Vercel environment variables.",
      });
    }

    if (err instanceof Stripe.errors.StripePermissionError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: "Stripe permission denied. Your restricted key (rk_) needs 'Checkout Sessions: Read' permission. Open your Stripe dashboard → Developers → Restricted Keys and enable it.",
      });
    }

    if (err instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: `Stripe invalid request: ${err.message}`,
      });
    }

    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: err instanceof Error ? err.message : "Unexpected error during verification.",
    });
  }
}
