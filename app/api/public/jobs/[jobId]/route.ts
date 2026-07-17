import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, status: "published" },
    include: { company: { select: { name: true, logoUrl: true, website: true, location: true, description: true } } },
  })

  if (!job) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  const session = await getServerSession(authOptions)
  let hasApplied = false
  if (session?.user?.id) {
    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostingId_userId: { jobPostingId: jobId, userId: session.user.id } },
      select: { id: true },
    })
    hasApplied = !!existing
  }

  return NextResponse.json({
    ...job,
    requiredSkills: (() => {
      try { return JSON.parse(job.requiredSkills) } catch { return [] }
    })(),
    hasApplied,
  })
}
