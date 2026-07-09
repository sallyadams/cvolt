import { NextRequest, NextResponse } from "next/server"
import { requireEmployerAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["applied", "shortlisted", "interview", "offer", "rejected"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const { applicationId } = await params

  const body = await request.json().catch(() => ({}))
  const { status } = body as { status?: string }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    )
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { jobPosting: { select: { companyId: true } } },
  })

  if (!application || application.jobPosting.companyId !== auth.companyId) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  })

  return NextResponse.json(updated)
}
