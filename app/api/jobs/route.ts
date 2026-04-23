import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, company, raw_text } = await req.json()
    if (!raw_text) {
      return NextResponse.json({ error: "Job description text is required" }, { status: 400 })
    }

    // Extract keywords (simple implementation - could be enhanced)
    const keywords = raw_text
      .toLowerCase()
      .match(/\b[a-z]{3,}\b/g) || []
    const uniqueKeywords = [...new Set(keywords)].slice(0, 20) // Limit to 20 keywords

    const job = await prisma.jobDescription.create({
      data: {
        userId: session.user.id,
        title: title || "Job Description",
        company: company || "",
        rawText: raw_text,
        extractedKeywords: JSON.stringify(uniqueKeywords),
      },
    })

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventName: "job_saved",
        properties: JSON.stringify({ hasTitle: !!title }),
      },
    })

    return NextResponse.json({
      jobId: job.id,
      title: job.title,
      company: job.company,
      keywords: uniqueKeywords,
    })
  } catch (error) {
    console.error("Save job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobs = await prisma.jobDescription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
      },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error("Get jobs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}