import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"
import { resolveCvText } from "@/lib/cv-text"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("linkedin_summaries")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cvId, targetRole } = await req.json()
    if (!cvId) {
      return NextResponse.json({ error: "CV ID is required" }, { status: 400 })
    }

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    const cvText = resolveCvText(cv)
    if (!cvText) {
      return NextResponse.json(
        { error: "CV content could not be read. Please re-upload your CV." },
        { status: 422 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = `You are a LinkedIn profile optimization expert. Write a complete, compelling LinkedIn profile upgrade for this candidate.
Rules: Sound human and confident, not AI-generated. Use first person. No clichés like "passionate professional".
Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "<first-person LinkedIn About section, max 2600 chars, starts with a hook not 'I am a...', includes who you are, what you do, what makes you different, ends with a soft call to action>",
  "headline_suggestions": ["<headline option 1>", "<headline option 2>", "<headline option 3>"],
  "keywords_included": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "experience_section": "<rewritten experience highlights — for each job, 2-3 achievement-focused bullets using action verbs and quantified results where possible>",
  "skills_section": "<comma-separated prioritized skills list optimized for searchability and ATS>",
  "character_count": 0
}`

    const userMessage = `CV:\n${cvText}\n\nTARGET ROLE/INDUSTRY: ${targetRole || "open to opportunities"}`

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
      const text = parsedContent.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
      result = JSON.parse(text)
    } catch {
      console.error("Failed to parse AI response:", parsedContent.text)
      return NextResponse.json({ error: "Failed to generate LinkedIn profile" }, { status: 500 })
    }

    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId,
        type: "linkedin_summary",
        content: JSON.stringify(result),
      },
    })

    await incrementAICredits(userId)

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "linkedin_summary_generated",
        properties: JSON.stringify({ targetRole }),
      },
    })

    return NextResponse.json({
      docId: doc.id,
      summary: result.summary,
      headlineSuggestions: result.headline_suggestions ?? [],
      keywords: result.keywords_included ?? [],
      experienceSection: result.experience_section ?? "",
      skillsSection: result.skills_section ?? "",
      characterCount: result.character_count ?? 0,
    })
  } catch (error) {
    console.error("LinkedIn summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
