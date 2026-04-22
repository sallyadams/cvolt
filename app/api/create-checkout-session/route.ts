import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "STRIPE_SECRET_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  // Reject publishable keys (pk_) — accept standard secret keys (sk_) and restricted keys (rk_)
  if (secretKey.startsWith("pk_")) {
    return NextResponse.json(
      {
        error:
          "STRIPE_SECRET_KEY is a publishable key (pk_). You need the secret key (sk_test_ / sk_live_) or a restricted key (rk_test_ / rk_live_) from the Stripe dashboard.",
      },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
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
      // {CHECKOUT_SESSION_ID} is a Stripe template literal — Stripe substitutes it
      success_url: `${origin}/build?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/build?payment=cancelled`,
      metadata: { product: "cv_download" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session]", err);

    // Surface auth failures explicitly so they're easy to diagnose
    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json(
        {
          error:
            "Stripe authentication failed (401). Your STRIPE_SECRET_KEY is present but Stripe rejected it — it may be revoked, belong to a different account, or be a restricted key missing checkout permissions. Check your Stripe dashboard.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout creation failed" },
      { status: 500 }
    );
  }
}
