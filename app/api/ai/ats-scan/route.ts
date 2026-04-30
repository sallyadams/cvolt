import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

function cvTextFromParsed(parsedJson: string): string {
  try {
    const p = JSON.parse(parsedJson)
    const lines: string[] = []
    if (p.personal?.name) lines.push(p.personal.name)
    if (p.personal?.email) lines.push(p.personal.email)
    if (p.personal?.phone) lines.push(p.personal.phone)
    if (p.personal?.location) lines.push(p.personal.location)
    if (p.summary) lines.push("\nSUMMARY\n" + p.summary)
    if (p.experience?.length) {
      lines.push("\nEXPERIENCE")
      for (const exp of p.experience) {
        lines.push(`${exp.title} at ${exp.company} (${exp.dates})`)
        if (exp.bullets?.length) lines.push(...exp.bullets.map((b: string) => `• ${b}`))
      }
    }
    if (p.education?.length) {
      lines.push("\nEDUCATION")
      for (const edu of p.education) {
        lines.push(`${edu.degree} — ${edu.institution} (${edu.dates})`)
      }
    }
    if (p.skills) {
      const skills = [
        ...(p.skills.technical || []),
        ...(p.skills.soft || []),
        ...(p.skills.tools || []),
        ...(p.skills.languages || []),
      ]
      if (skills.length) lines.push("\nSKILLS\n" + skills.join(", "))
    }
    if (p.certifications?.length) {
      lines.push("\nCERTIFICATIONS\n" + p.certifications.join(", "))
    }
    return lines.filter(Boolean).join("\n").trim()
  } catch {
    return ""
  }
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("ats_scans")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await req.json().catch(() => ({}))
    const { cv_id, job_id } = body as { cv_id?: string; job_id?: string }

    if (!cv_id) {
      return NextResponse.json({ error: "CV ID is required" }, { status: 400 })
    }

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cv_id, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    // PDF uploads store a placeholder in rawText — reconstruct from parsed JSON
    let cvText = cv.rawText ?? ""
    if (!cvText || cvText.startsWith("[PDF:")) {
      console.log(`[ats-scan] rawText is placeholder, rebuilding from parsedJson for cv ${cv_id}`)
      cvText = cvTextFromParsed(cv.parsedJson ?? "")
    }

    if (!cvText) {
      return NextResponse.json(
        { error: "CV content could not be read. Please re-upload your CV." },
        { status: 422 }
      )
    }

    let jobDescription = ""
    if (job_id) {
      const job = await prisma.jobDescription.findFirst({
        where: { id: job_id, userId },
      })
      jobDescription = job?.rawText || ""
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    })
    const isPremium = user?.subscriptionTier !== "free"

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error("[ats-scan] ANTHROPIC_API_KEY not set")
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze the CV against the job description (if provided).
Return ONLY valid JSON with NO markdown, NO code fences, NO extra text — just the raw JSON object:
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

    const jobSection = jobDescription
      ? `JOB DESCRIPTION:\n${jobDescription}\n\n`
      : "No job description provided — perform a general ATS analysis.\n\n"

    const userMessage = `${jobSection}CANDIDATE CV:\n${cvText}`

    console.log(`[ats-scan] Starting scan for cv=${cv_id} user=${userId} textLen=${cvText.length}`)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const parsedContent = response.content[0]
    if (parsedContent.type !== "text") {
      throw new Error("Unexpected non-text response from AI")
    }

    let result
    try {
      result = JSON.parse(stripCodeFences(parsedContent.text))
    } catch {
      console.error("[ats-scan] JSON parse failed. Raw response:", parsedContent.text.slice(0, 500))
      return NextResponse.json({ error: "Failed to analyze CV" }, { status: 500 })
    }

    const scan = await prisma.aTSScan.create({
      data: {
        userId,
        cvId: cv_id,
        jobId: job_id ?? null,
        overallScore: result.overall_score,
        keywordMatches: JSON.stringify(result.keyword_analysis),
        formatIssues: JSON.stringify(result.format_issues),
        recommendations: JSON.stringify(result.top_3_fixes),
      },
    })

    await incrementAICredits(userId)

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

    console.log(`[ats-scan] Scan complete. score=${result.overall_score} scanId=${scan.id}`)

    return NextResponse.json({
      scanId: scan.id,
      is_premium: isPremium,
      ...result,
    })
  } catch (error) {
    console.error("[ats-scan] Unhandled error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
