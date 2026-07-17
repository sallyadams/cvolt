import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { conversationId } = await params

  const conversation = await prisma.coachConversation.findFirst({
    where: { id: conversationId, userId: auth.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  return NextResponse.json(conversation)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { conversationId } = await params

  const existing = await prisma.coachConversation.findFirst({
    where: { id: conversationId, userId: auth.userId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  await prisma.coachConversation.delete({ where: { id: conversationId } })

  return NextResponse.json({ success: true })
}
