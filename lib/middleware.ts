import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface TierLimits {
  ats_scans: number
  recruiter_scans: number
  bullets: number
  cover_letters: number
  linkedin_summaries: number
  tailored_cvs: number
  interview_scores: number
  job_matcher: number
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    ats_scans: 1,
    recruiter_scans: 0,
    bullets: 3,
    cover_letters: 0,
    linkedin_summaries: 0,
    tailored_cvs: 0,
    interview_scores: 0,
    job_matcher: 0,
  },
  starter: {
    ats_scans: 5,
    recruiter_scans: 3,
    bullets: 20,
    cover_letters: 2,
    linkedin_summaries: 1,
    tailored_cvs: 0,
    interview_scores: 3,
    job_matcher: 3,
  },
  pro: {
    ats_scans: 20,
    recruiter_scans: 15,
    bullets: 100,
    cover_letters: 10,
    linkedin_summaries: 5,
    tailored_cvs: 5,
    interview_scores: 10,
    job_matcher: 10,
  },
  premium: {
    ats_scans: Infinity,
    recruiter_scans: Infinity,
    bullets: Infinity,
    cover_letters: Infinity,
    linkedin_summaries: Infinity,
    tailored_cvs: Infinity,
    interview_scores: Infinity,
    job_matcher: Infinity,
  },
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof TierLimits
): Promise<{ allowed: boolean; tier?: string; used?: number; limit?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      aiCreditsUsed: true,
      aiCreditsLimit: true,
    },
  })

  if (!user) {
    return { allowed: false }
  }

  const tier = user.subscriptionTier
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free
  const limit = limits[feature]

  // For free tier: features with limit 0 are disabled outright; features with
  // limit > 0 draw from the user's shared credit budget (aiCreditsLimit, default 3).
  // This prevents a single scan from permanently blocking the account.
  if (tier === "free") {
    if (limit === 0) {
      return { allowed: false, tier, used: 0, limit: 0 }
    }
    const used = user.aiCreditsUsed
    const creditLimit = user.aiCreditsLimit
    return {
      allowed: used < creditLimit,
      tier,
      used,
      limit: creditLimit,
    }
  }

  // Paid tiers get full access to their enabled features
  return {
    allowed: true,
    tier,
    limit,
  }
}

export async function incrementAICredits(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { aiCreditsUsed: { increment: 1 } },
  })
}

export async function requireAuth(
  req?: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return { userId: session.user.id }
}

export async function requireAuthAndFeature(
  feature: keyof TierLimits
): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await checkFeatureAccess(session.user.id, feature)
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: "Feature limit reached",
        upgrade_required: true,
        tier_needed: access.tier === "free" ? "starter" : "pro",
        feature,
      },
      { status: 402 }
    )
  }

  return { userId: session.user.id }
}