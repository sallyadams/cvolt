import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("bullets")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id, section } = await req.json()
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

    // Extract bullets from CV
    let parsedCV
    try {
      parsedCV = JSON.parse(cv.parsedJson)
    } catch {
      return NextResponse.json({ error: "Invalid CV data" }, { status: 400 })
    }

    const bullets = section
      ? parsedCV.experience?.find((exp: any) => exp.title?.toLowerCase().includes(section.toLowerCase()))?.bullets || []
      : parsedCV.experience?.flatMap((exp: any) => exp.bullets) || []

    if (!bullets.length) {
      return NextResponse.json({ error: "No bullets found" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Use exact prompt from Part 6.5
    const systemPrompt = `You are a CV writing expert. Rewrite the provided bullet points to be:
- Achievement-focused (not task-focused)
- Quantified where possible (add realistic placeholders like [X%] if no numbers given)
- Starting with a strong action verb
- Concise (max 20 words)
- ATS-friendly
Return ONLY valid JSON:
{
  "improvements": [
    {
      "original": "",
      "improved": "",
      "rationale": "<one sentence explaining what changed and why>",
      "strength_increase": <1-10>
    }
  ]
}`

    const userMessage = `Improve these CV bullet points:\n\n${bullets.join("\n")}`

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
      return NextResponse.json({ error: "Failed to improve bullets" }, { status: 500 })
    }

    // Save improvements
    const improvements = await Promise.all(
      result.improvements.map((imp: any) =>
        prisma.bulletImprovement.create({
          data: {
            userId,
            cvId: cv_id,
            originalBullet: imp.original,
            improvedBullet: imp.improved,
            improvementRationale: imp.rationale,
          },
        })
      )
    )

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "bullets_improved",
        properties: JSON.stringify({
          count: result.improvements.length,
        }),
      },
    })

    return NextResponse.json({
      improvements: improvements.map((imp) => ({
        id: imp.id,
        original: imp.originalBullet,
        improved: imp.improvedBullet,
        rationale: imp.improvementRationale,
      })),
    })
  } catch (error) {
    console.error("Bullet improver error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}