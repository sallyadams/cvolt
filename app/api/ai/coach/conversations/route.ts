import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const conversations = await prisma.coachConversation.findMany({
    where: { userId: auth.userId },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(conversations)
}

export async function POST() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const conversation = await prisma.coachConversation.create({
    data: { userId: auth.userId },
  })

  return NextResponse.json(conversation)
}
