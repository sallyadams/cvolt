import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { requireAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const profile = await prisma.profile.findUnique({ where: { userId: auth.userId } })

  return NextResponse.json(profile)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const {
    fullName, jobTitle, location, phone, linkedin, website, summary,
    skills, experience, education,
  } = body as {
    fullName?: string; jobTitle?: string; location?: string; phone?: string
    linkedin?: string; website?: string; summary?: string
    skills?: string[]; experience?: unknown[]; education?: unknown[]
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId: auth.userId },
      create: {
        userId: auth.userId,
        fullName, jobTitle, location, phone, linkedin, website, summary,
        skills: (skills ?? []) as Prisma.InputJsonValue,
        experience: (experience ?? []) as Prisma.InputJsonValue,
        education: (education ?? []) as Prisma.InputJsonValue,
      },
      update: {
        fullName, jobTitle, location, phone, linkedin, website, summary,
        skills: (skills ?? []) as Prisma.InputJsonValue,
        experience: (experience ?? []) as Prisma.InputJsonValue,
        education: (education ?? []) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[/api/profile POST] error:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
