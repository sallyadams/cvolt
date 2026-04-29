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
  if (fwdHost) {
    return `${fwdProto}://${fwdHost}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  const origin = req.headers.get("origin")
  if (origin) return origin
  const host = req.headers.get("host")
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https"
    return `${proto}://${host}`
  }
  return "http://localhost:3000"
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`)
  }
  return value
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier } = await req.json()
    if (!tier) {
      return NextResponse.json({ error: "Tier is required" }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
    })

    // Get or create Stripe customer
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
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Map tier to Stripe price ID (must be set up in Stripe dashboard)
    const tierToPriceId: Record<string, string> = {
      starter: getRequiredEnvVar("STRIPE_PRICE_STARTER"),
      pro: getRequiredEnvVar("STRIPE_PRICE_PRO"),
      premium: getRequiredEnvVar("STRIPE_PRICE_PREMIUM"),
    }

    const priceId = tierToPriceId[tier]
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    const baseUrl = getBaseUrl(req)

    const session_new = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/app?upgraded=true`,
      cancel_url: `${baseUrl}/app/upgrade`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId: session.user.id, tier },
      },
    })

    return NextResponse.json({ url: session_new.url })
  } catch (error) {
    console.error("Checkout error:", error)
    if (error instanceof Error && error.message.includes("Environment variable")) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}