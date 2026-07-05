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
    if (p.summary) lines.push("\nSUMMARY\n" + p.summary)
    if (p.experience?.length) {
      lines.push("\nEXPERIENCE")
      for (const exp of p.experience) {
        lines.push(`${exp.title ?? ""} at ${exp.company ?? ""} (${exp.dates ?? exp.period ?? ""})`)
        if (exp.bullets?.length) lines.push(...exp.bullets.map((b: string) => `• ${b}`))
      }
    }
    if (p.education?.length) {
      lines.push("\nEDUCATION")
      for (const edu of p.education) {
        lines.push(`${edu.degree ?? ""} — ${edu.institution ?? ""} (${edu.dates ?? ""})`)
      }
    }
    if (p.skills) {
      const skills = [
        ...(Array.isArray(p.skills) ? p.skills : []),
        ...(p.skills.technical || []),
        ...(p.skills.soft || []),
        ...(p.skills.tools || []),
      ]
      if (skills.length) lines.push("\nSKILLS\n" + skills.join(", "))
    }
    return lines.filter(Boolean).join("\n").trim()
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("tailored_cvs")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id, job_id } = await req.json()
    if (!cv_id || !job_id) {
      return NextResponse.json({ error: "CV ID and Job ID are required" }, { status: 400 })
    }

    // Get CV and job data
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cv_id, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    const job = await prisma.jobDescription.findFirst({
      where: { id: job_id, userId },
    })
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Use exact prompt from Part 6.8
    const systemPrompt = `You are a CV tailoring specialist. Rewrite the candidate's CV to be optimized for this specific job.
Rules:
- Keep all facts true — do not fabricate experience
- Reorder and reframe existing experience to match job requirements
- Rewrite the summary to directly address the role
- Adjust skills section to prioritize relevant skills
- Improve bullet points to emphasize relevant achievements
- Add any missing keywords that are honestly represented by the candidate's experience
Return ONLY valid JSON with the same structure as the input CV JSON, with modifications applied.`

    const userMessage = `JOB DESCRIPTION:\n${job.rawText}\n\nORIGINAL CV JSON:\n${cv.parsedJson}`

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
      return NextResponse.json({ error: "Failed to tailor CV" }, { status: 500 })
    }

    // Save tailored CV as new version — rawText must be readable text, not JSON
    const tailoredCV = await prisma.cVDocument.create({
      data: {
        userId,
        title: `${cv.title} (Tailored for ${job.title})`,
        rawText: cvTextFromParsed(JSON.stringify(result)) || JSON.stringify(result),
        parsedJson: JSON.stringify(result),
        version: (cv.version || 1) + 1,
      },
    })

    // Save as generated document too
    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId: cv_id,
        jobId: job_id,
        type: "tailored_cv",
        content: JSON.stringify(result),
      },
    })

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "cv_tailored",
        properties: JSON.stringify({ jobId: job_id }),
      },
    })

    let originalCV: unknown = null
    try { originalCV = JSON.parse(cv.parsedJson) } catch { /* ignore */ }

    return NextResponse.json({
      cvId: tailoredCV.id,
      docId: doc.id,
      tailoredCV: result,
      originalCV,
    })
  } catch (error) {
    console.error("Tailor CV error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}