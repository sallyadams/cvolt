import { NextRequest, NextResponse } from "next/server"
import { requireEmployerAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const jobs = await prisma.jobPosting.findMany({
    where: { companyId: auth.companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobApplications: true } } },
  })

  return NextResponse.json(
    jobs.map((job) => ({
      ...job,
      requiredSkills: (() => {
        try { return JSON.parse(job.requiredSkills) } catch { return [] }
      })(),
      applicantCount: job._count.jobApplications,
      _count: undefined,
    }))
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
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
    salaryMin?: number
    salaryMax?: number
    salaryCurrency?: string
    requiredSkills?: string[]
    status?: string
  }

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 })
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 })
  }

  try {
    const job = await prisma.jobPosting.create({
      data: {
        companyId: auth.companyId,
        title: title.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        remote: !!remote,
        employmentType: employmentType || null,
        experienceLevel: experienceLevel || null,
        salaryMin: typeof salaryMin === "number" ? salaryMin : null,
        salaryMax: typeof salaryMax === "number" ? salaryMax : null,
        salaryCurrency: salaryCurrency || "EUR",
        requiredSkills: JSON.stringify(Array.isArray(requiredSkills) ? requiredSkills : []),
        status: status === "published" ? "published" : "draft",
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error("[employer/jobs] create error:", error)
    return NextResponse.json({ error: "Failed to create job posting" }, { status: 500 })
  }
}
