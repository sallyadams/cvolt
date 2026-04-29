import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const TIER_CREDITS: Record<string, number> = {
  free: 3,
  starter: 30,
  pro: 150,
  premium: 999999,
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  })

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const userId = session.metadata?.userId
        const tier = session.metadata?.tier || "starter"
        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "active",
            subscriptionTier: tier,
            aiCreditsLimit: TIER_CREDITS[tier] ?? 30,
            aiCreditsUsed: 0,
          },
        })
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        const priceId = subscription.items.data[0].price.id
        let tier = "free"

        if (priceId === process.env.STRIPE_PRICE_STARTER) tier = "starter"
        else if (priceId === process.env.STRIPE_PRICE_PRO) tier = "pro"
        else if (priceId === process.env.STRIPE_PRICE_PREMIUM) tier = "premium"
        else {
          console.warn(`[webhook] Unrecognized price ID: ${priceId}. Available: STARTER=${process.env.STRIPE_PRICE_STARTER}, PRO=${process.env.STRIPE_PRICE_PRO}, PREMIUM=${process.env.STRIPE_PRICE_PREMIUM}`)
        }

        const endDate = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000)
          : null

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: subscription.status,
            subscriptionTier: tier,
            subscriptionEndDate: endDate,
            aiCreditsLimit: TIER_CREDITS[tier] ?? 3,
            aiCreditsUsed: 0,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionTier: "free",
            aiCreditsLimit: TIER_CREDITS.free,
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "past_due" },
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "active",
              aiCreditsUsed: 0, // Reset monthly credits
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}