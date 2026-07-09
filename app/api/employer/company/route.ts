import { NextRequest, NextResponse } from "next/server"
import { requireEmployerAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const company = await prisma.company.findUnique({
    where: { id: auth.companyId },
  })

  return NextResponse.json(company)
}

export async function PUT(req: NextRequest) {
  const auth = await requireEmployerAuth()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
  const { name, logoUrl, website, description, industry, location } = body as {
    name?: string
    logoUrl?: string
    website?: string
    description?: string
    industry?: string
    location?: string
  }

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Company name cannot be empty" }, { status: 400 })
  }

  try {
    const company = await prisma.company.update({
      where: { id: auth.companyId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl.trim() || null }),
        ...(website !== undefined && { website: website.trim() || null }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(industry !== undefined && { industry: industry.trim() || null }),
        ...(location !== undefined && { location: location.trim() || null }),
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("[employer/company] update error:", error)
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 })
  }
}
