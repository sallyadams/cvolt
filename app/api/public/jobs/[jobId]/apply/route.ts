import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const session = await getServerSession(authOptions)
  if (session?.user?.role === "employer") {
    return NextResponse.json(
      { error: "Employer accounts can't apply to jobs" },
      { status: 403 }
    )
  }

  const { jobId } = await params

  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, status: "published" },
    select: { id: true },
  })
  if (!job) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { cvId, coverLetter } = body as { cvId?: string; coverLetter?: string }

  if (!cvId) {
    return NextResponse.json({ error: "Please select a CV" }, { status: 400 })
  }

  const cv = await prisma.cVDocument.findFirst({
    where: { id: cvId, userId: auth.userId },
    select: { id: true },
  })
  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 })
  }

  try {
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId: jobId,
        userId: auth.userId,
        cvId,
        coverLetter: coverLetter?.trim() || null,
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "You've already applied to this job" }, { status: 409 })
    }
    console.error("[public/jobs/apply] error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
