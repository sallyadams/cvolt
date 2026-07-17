import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  const remoteOnly = req.nextUrl.searchParams.get("remote") === "true"

  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: "published",
        ...(remoteOnly && { remote: true }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: { company: { select: { name: true, logoUrl: true, location: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      jobs.map((job) => ({
        ...job,
        requiredSkills: (() => {
          try { return JSON.parse(job.requiredSkills) } catch { return [] }
        })(),
      }))
    )
  } catch (error) {
    console.error("[public/jobs] list error:", error)
    return NextResponse.json({ error: "Failed to load job postings" }, { status: 500 })
  }
}
