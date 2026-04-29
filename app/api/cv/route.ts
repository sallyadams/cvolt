import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cvs = await prisma.cVDocument.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true, title: true, createdAt: true, version: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cvs)
}
