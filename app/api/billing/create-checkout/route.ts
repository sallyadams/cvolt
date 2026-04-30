import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  const fwdHost = req.headers.get("x-forwarded-host")
  const fwdProto = req.headers.get("x-forwarded-proto") ?? "https"
  if (fwdHost) return `${fwdProto}://${fwdHost}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const origin = req.headers.get("origin")
  if (origin) return origin
  const host = req.headers.get("host")
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https"
    return `${proto}://${host}`
  }
  return "http://localhost:3000"
}

function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  // Support both naming conventions
  const priceStarter =
    process.env.STRIPE_PRICE_STARTER?.trim() ||
    process.env.STRIPE_STARTER_PRICE_ID?.trim()
  const pricePro =
    process.env.STRIPE_PRICE_PRO?.trim() ||
    process.env.STRIPE_PRO_PRICE_ID?.trim()
  const pricePremium =
    process.env.STRIPE_PRICE_PREMIUM?.trim() ||
    process.env.STRIPE_PREMIUM_PRICE_ID?.trim()

  const missing: string[] = []
  if (!secretKey) missing.push("STRIPE_SECRET_KEY")
  if (!priceStarter) missing.push("STRIPE_PRICE_STARTER")
  if (!pricePro) missing.push("STRIPE_PRICE_PRO")
  if (!pricePremium) missing.push("STRIPE_PRICE_PREMIUM")

  if (missing.length > 0) {
    return { configured: false as const, missing }
  }

  return {
    configured: true as const,
    secretKey: secretKey!,
    priceIds: {
      starter: priceStarter!,
      pro: pricePro!,
      premium: pricePremium!,
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { tier } = body as { tier?: string }
    if (!tier) {
      return NextResponse.json({ error: "Tier is required" }, { status: 400 })
    }

    const config = getStripeConfig()
    if (!config.configured) {
      console.warn("Stripe not configured. Missing:", config.missing)
      return NextResponse.json(
        { success: false, error: "Stripe is not configured" },
        { status: 503 }
      )
    }

    const priceId = config.priceIds[tier as keyof typeof config.priceIds]
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const stripe = new Stripe(config.secretKey, {
      apiVersion: "2026-04-22.dahlia",
    })

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const baseUrl = getBaseUrl(req)

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/upgrade`,
      allow_promotion_codes: true,
      metadata: { userId: session.user.id, tier },
      subscription_data: { metadata: { userId: session.user.id, tier } },
    })

    return NextResponse.json({ success: true, url: checkout.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
