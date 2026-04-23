import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature(req, "ats_scans")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id, job_id } = await req.json()
    if (!cv_id) {
      return NextResponse.json({ error: "CV ID is required" }, { status: 400 })
    }

    // Get CV and job data
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cv_id, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    let jobDescription = ""
    if (job_id) {
      const job = await prisma.jobDescription.findFirst({
        where: { id: job_id, userId },
      })
      jobDescription = job?.rawText || ""
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Use exact prompt from Part 6.2
    const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze the CV against the job description.
Return ONLY valid JSON:
{
  "overall_score": <0-100>,
  "keyword_analysis": {
    "matched": [{ "keyword": "", "frequency": 0, "context": "" }],
    "missing_critical": [""],
    "missing_beneficial": [""],
    "overused": [""]
  },
  "format_score": <0-100>,
  "format_issues": [""],
  "section_scores": {
    "summary": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>
  },
  "top_3_fixes": [{ "fix": "", "impact": "high|medium|low", "effort": "5min|15min|30min" }],
  "verdict": "<1 sentence honest assessment>"
}`

    const userMessage = `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cv.rawText}`

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
    const scan = await prisma.aTSScan.create({
      data: {
        userId,
        cvId: cv_id,
        jobId: job_id,
        overallScore: result.overall_score,
        keywordMatches: JSON.stringify(result.keyword_analysis),
        formatIssues: JSON.stringify(result.format_issues),
        recommendations: JSON.stringify(result.top_3_fixes),
      },
    })

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "scan_completed",
        properties: JSON.stringify({
          type: "ats",
          score: result.overall_score,
          has_job: !!job_id,
        }),
      },
    })

    return NextResponse.json({
      scanId: scan.id,
      ...result,
    })
  } catch (error) {
    console.error("ATS scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}