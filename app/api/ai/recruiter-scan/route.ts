import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature(req, "recruiter_scans")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id } = await req.json()
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

    // Use exact prompt from Part 6.3
    const systemPrompt = `You are a senior recruiter with 10+ years of experience screening CVs for top companies.
You have 6 seconds to scan a CV — just like in real life. Evaluate this CV as you would in that first scan.
Return ONLY valid JSON:
{
  "first_impression_score": <0-100>,
  "first_impression_verdict": "<honest 1-sentence gut reaction>",
  "clarity_score": <0-100>,
  "clarity_issues": [""],
  "impact_score": <0-100>,
  "impact_issues": [""],
  "overall_score": <0-100>,
  "strengths": [""],
  "red_flags": [""],
  "would_interview": true|false,
  "reason_for_decision": "",
  "top_3_improvements": [{ "what": "", "why": "", "example": "" }]
}`

    const userMessage = `Review this CV as a recruiter:\n\n${cv.rawText}`

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
      return NextResponse.json({ error: "Failed to analyze CV" }, { status: 500 })
    }

    // Save scan result
    const scan = await prisma.recruiterScan.create({
      data: {
        userId,
        cvId: cv_id,
        clarityScore: result.clarity_score,
        impactScore: result.impact_score,
        firstImpressionScore: result.first_impression_score,
        overallScore: result.overall_score,
        feedback: JSON.stringify({
          strengths: result.strengths,
          weaknesses: result.red_flags,
          suggestions: result.top_3_improvements,
          wouldInterview: result.would_interview,
          reasonForDecision: result.reason_for_decision,
        }),
      },
    })

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "recruiter_scan_completed",
        properties: JSON.stringify({
          score: result.overall_score,
          wouldInterview: result.would_interview,
        }),
      },
    })

    return NextResponse.json({
      scanId: scan.id,
      ...result,
    })
  } catch (error) {
    console.error("Recruiter scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}