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
    include: { _count: { select: { jobApplications: true } } },
  })

  if (!job) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...job,
    requiredSkills: (() => {
      try { return JSON.parse(job.requiredSkills) } catch { return [] }
    })(),
    applicantCount: job._count.jobApplications,
    _count: undefined,
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const { jobId } = await params

  const existing = await prisma.jobPosting.findFirst({
    where: { id: jobId, companyId: auth.companyId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const {
    title,
    description,
    location,
    remote,
    employmentType,
    experienceLevel,
    salaryMin,
    salaryMax,
    salaryCurrency,
    requiredSkills,
    status,
  } = body as {
    title?: string
    description?: string
    location?: string
    remote?: boolean
    employmentType?: string
    experienceLevel?: string
    salaryMin?: number | null
    salaryMax?: number | null
    salaryCurrency?: string
    requiredSkills?: string[]
    status?: string
  }

  if (status !== undefined && !["draft", "published", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  try {
    const job = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(remote !== undefined && { remote: !!remote }),
        ...(employmentType !== undefined && { employmentType: employmentType || null }),
        ...(experienceLevel !== undefined && { experienceLevel: experienceLevel || null }),
        ...(salaryMin !== undefined && { salaryMin }),
        ...(salaryMax !== undefined && { salaryMax }),
        ...(salaryCurrency !== undefined && { salaryCurrency }),
        ...(requiredSkills !== undefined && { requiredSkills: JSON.stringify(requiredSkills) }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error("[employer/jobs/:id] update error:", error)
    return NextResponse.json({ error: "Failed to update job posting" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const { jobId } = await params

  const existing = await prisma.jobPosting.findFirst({
    where: { id: jobId, companyId: auth.companyId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
  }

  await prisma.jobPosting.delete({ where: { id: jobId } })

  return NextResponse.json({ success: true })
}
