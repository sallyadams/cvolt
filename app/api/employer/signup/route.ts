import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { email, password, fullName, companyName } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName?.trim() || null,
        role: "employer",
        company: {
          create: {
            name: companyName.trim(),
          },
        },
      },
      include: { company: true },
    })

    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          eventName: "employer_signup_completed",
          properties: JSON.stringify({ method: "email" }),
        },
      })
    } catch {
      // Non-critical — don't fail signup if analytics write fails
    }

    return NextResponse.json({
      message: "Employer account created successfully",
      user: { id: user.id, email: user.email, fullName: user.fullName },
      company: { id: user.company!.id, name: user.company!.name },
    })
  } catch (error) {
    console.error("[employer/signup] error:", error)
    const isDev = process.env.NODE_ENV === "development"
    const message = isDev && error instanceof Error ? error.message : "Failed to create employer account. Please try again."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
