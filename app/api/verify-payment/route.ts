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
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    console.log("[verify-payment] retrieving session:", sessionId.slice(0, 25) + "…");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified = session.payment_status === "paid";

    console.log("[verify-payment] session retrieved:", {
      id: session.id.slice(0, 25) + "…",
      payment_status: session.payment_status,
      verified,
    });

    return NextResponse.json({
      verified,
      payment_status: session.payment_status,
    });
  } catch (err) {
    console.error("[verify-payment] Stripe error:", {
      name: err instanceof Error ? err.name : "Unknown",
      message: err instanceof Error ? err.message : String(err),
      type: err instanceof Stripe.errors.StripeError ? err.constructor.name : "Non-Stripe Error",
    });

    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: "Stripe API authentication failed (401). Please verify STRIPE_SECRET_KEY is set correctly on Vercel.",
      });
    }

    if (err instanceof Stripe.errors.StripePermissionError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: "Stripe permission denied. Your API key needs 'Checkout Sessions: Read' permission.",
      });
    }

    if (err instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: `Invalid session ID or request: ${err.message}`,
      });
    }

    // Generic Stripe error
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        verified: false,
        payment_status: "unknown",
        error: `Stripe error: ${err.message}`,
      });
    }

    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: err instanceof Error ? err.message : "Unexpected error during verification.",
    });
  }
}
