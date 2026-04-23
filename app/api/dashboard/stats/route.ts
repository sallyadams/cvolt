import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        atsScans: {
          select: { overallScore: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { atsScans: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: user.aiCreditsLimit,
      totalScans: user._count.atsScans,
      lastScore: user.atsScans[0]?.overallScore || null,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}