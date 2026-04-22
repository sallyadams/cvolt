import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// Always returns HTTP 200 so the client can read `data.error` on failures.
// Whether the PDF unlocks is controlled solely by `data.verified`.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: "Missing session_id in request.",
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    console.error("[verify-payment] STRIPE_SECRET_KEY is not set in .env.local");
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error: "STRIPE_SECRET_KEY is not set. Add it to .env.local and restart the server.",
    });
  }

  if (secretKey.startsWith("pk_")) {
    console.error("[verify-payment] Key is a publishable key, not a secret/restricted key");
    return NextResponse.json({
      verified: false,
      payment_status: "unknown",
      error:
        "STRIPE_SECRET_KEY is a publishable key (pk_). Use the secret key (sk_) or restricted key (rk_) instead.",
    });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  try {
    console.log("[verify-payment] retrieving session:", sessionId.slice(0, 20) + "...");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified = session.payment_status === "paid";

    console.log("[verify-payment] payment_status:", session.payment_status, "→ verified:", verified);

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
        error:
          "Stripe rejected the API key (401). It may have been rolled or deleted. Go to stripe.com/dashboard → Developers → API Keys and copy the current secret key into .env.local, then restart the server.",
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
