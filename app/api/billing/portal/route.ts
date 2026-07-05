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
  const host = req.headers.get("host")
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https"
    return `${proto}://${host}`
  }
  return "http://localhost:3000"
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe first." },
        { status: 404 }
      )
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" })
    const baseUrl = getBaseUrl(req)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[billing/portal]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
