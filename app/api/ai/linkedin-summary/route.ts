import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("linkedin_summaries")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id, target_role } = await req.json()
    if (!cv_id) {
      return NextResponse.json({ error: "CV ID is required" }, { status: 400 })
    }

    // Get CV data
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cv_id, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Use exact prompt from Part 6.7
    const systemPrompt = `You are a LinkedIn profile optimization expert. Write a first-person LinkedIn summary.
Rules: Max 2,600 characters. Start with a hook (not "I am a..."). 
Include: who you are, what you do, what makes you different, what you're looking for.
End with a soft CTA. Use line breaks for readability. Sound human and confident.
Return ONLY valid JSON:
{
  "summary": "",
  "headline_suggestions": [""],
  "keywords_included": [],
  "character_count": 0
}`

    const userMessage = `CV:\n${cv.rawText}\n\nTARGET ROLE/INDUSTRY: ${target_role || "open to opportunities"}`

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const parsedContent = response.content[0]
    if (parsedContent.type !== "text") {
      throw new Error("Unexpected response type")
    }

    let result
    try {
      result = JSON.parse(parsedContent.text)
    } catch (err) {
      console.error("Failed to parse AI response:", parsedContent.text)
      return NextResponse.json({ error: "Failed to generate LinkedIn summary" }, { status: 500 })
    }

    // Save generated document
    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId: cv_id,
        type: "linkedin_summary",
        content: JSON.stringify(result),
      },
    })

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "linkedin_summary_generated",
        properties: JSON.stringify({ targetRole: target_role }),
      },
    })

    return NextResponse.json({
      docId: doc.id,
      ...result,
    })
  } catch (error) {
    console.error("LinkedIn summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}