import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("bullets")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await req.json()

    // Accept either freeform bullets array or a cv_id to extract from
    let bullets: string[] = []

    if (Array.isArray(body.bullets) && body.bullets.length > 0) {
      bullets = body.bullets.map((b: string) => String(b).trim()).filter(Boolean)
    } else if (body.cv_id) {
      const cv = await prisma.cVDocument.findFirst({
        where: { id: body.cv_id, userId },
      })
      if (!cv) {
        return NextResponse.json({ error: "CV not found" }, { status: 404 })
      }
      try {
        const parsed = JSON.parse(cv.parsedJson)
        bullets = parsed.experience?.flatMap((exp: { bullets?: string[] }) => exp.bullets ?? []) ?? []
      } catch {
        return NextResponse.json({ error: "Invalid CV data" }, { status: 400 })
      }
    }

    if (!bullets.length) {
      return NextResponse.json({ error: "No bullet points provided" }, { status: 400 })
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
      model: "claude-sonnet-4-6",
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

    const cvId: string | null = body.cv_id ?? null

    // Save improvements
    const improvements = await Promise.all(
      result.improvements.map((imp: { original: string; improved: string; rationale: string }) =>
        prisma.bulletImprovement.create({
          data: {
            userId,
            cvId,
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

    const mapped = improvements.map((imp) => ({
      id: imp.id,
      original: imp.originalBullet,
      improved: imp.improvedBullet,
      explanation: imp.improvementRationale,
    }))

    return NextResponse.json({
      improvedBullets: mapped,
      improvements: mapped,
    })
  } catch (error) {
    console.error("Bullet improver error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}