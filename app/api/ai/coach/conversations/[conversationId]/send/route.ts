import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"
import { COACH_TOOLS, executeCoachTool } from "@/lib/coach-tools"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const COACH_SYSTEM_PROMPT = `You are the CVOLT Career Coach, an encouraging, direct AI career advisor embedded in a job-seeking platform.

You have tools to look up the job seeker's real CVs, ATS scan results, interview scores, and job application pipeline. Use them whenever a question would benefit from their actual data instead of generic advice — for example, before commenting on their CV quality, call get_cv or get_latest_ats_scan rather than guessing. Don't call a tool if the conversation already gives you what you need.

Keep replies concise and actionable: concrete next steps over vague encouragement. Never fabricate scores, CV content, or application data — only state facts you retrieved via tools.`

const MAX_TOOL_ROUNDS = 5

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireAuthAndFeature("career_coach_messages")
  if (auth instanceof NextResponse) return auth

  const { conversationId } = await params

  const conversation = await prisma.coachConversation.findFirst({
    where: { id: conversationId, userId: auth.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { content } = body as { content?: string }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 })
  }

  const history: Anthropic.MessageParam[] = conversation.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }))

  const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: content.trim() }]

  try {
    let replyText = ""

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: COACH_SYSTEM_PROMPT,
        tools: COACH_TOOLS,
        messages,
      })

      if (response.stop_reason !== "tool_use") {
        replyText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim()
        break
      }

      messages.push({ role: "assistant", content: response.content })

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      )
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(await executeCoachTool(auth.userId, block.name, block.input)),
        }))
      )

      messages.push({ role: "user", content: toolResults })
    }

    if (!replyText) {
      return NextResponse.json(
        { error: "The coach couldn't finish forming a reply. Please try again." },
        { status: 500 }
      )
    }

    const isFirstMessage = conversation.messages.length === 0

    await prisma.coachMessage.createMany({
      data: [
        { conversationId, role: "user", content: content.trim() },
        { conversationId, role: "assistant", content: replyText },
      ],
    })

    await prisma.coachConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        ...(isFirstMessage && { title: content.trim().slice(0, 60) }),
      },
    })

    await incrementAICredits(auth.userId)

    return NextResponse.json({ reply: replyText })
  } catch (error) {
    console.error("[coach/send] error:", error)
    return NextResponse.json(
      { error: "Failed to get a reply from the career coach. Please try again." },
      { status: 500 }
    )
  }
}
