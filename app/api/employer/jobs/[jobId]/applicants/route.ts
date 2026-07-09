import { NextRequest, NextResponse } from "next/server"
import { requireEmployerAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const { jobId } = await params

  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, companyId: auth.companyId },
    select: { id: true, title: true },
  })
  if (!job) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  const applicants = await prisma.jobApplication.findMany({
    where: { jobPostingId: jobId },
    orderBy: { createdAt: "desc" },
    include: {
      applicant: { select: { id: true, email: true, fullName: true } },
      cvDocument: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json({
    job,
    applicants: applicants.map((a) => ({
      id: a.id,
      status: a.status,
      coverLetter: a.coverLetter,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      applicant: a.applicant,
      cv: a.cvDocument,
    })),
  })
}
