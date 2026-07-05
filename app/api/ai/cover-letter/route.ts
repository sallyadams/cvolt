import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("cover_letters")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cvId, jobId, jobDescription, tone } = await req.json()
    if (!cvId || (!jobId && !jobDescription)) {
      return NextResponse.json(
        { error: "CV ID and either a Job ID or job description text are required" },
        { status: 400 }
      )
    }

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    })
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    let jobText: string
    let resolvedJobId: string

    if (jobId) {
      const job = await prisma.jobDescription.findFirst({
        where: { id: jobId, userId },
      })
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }
      jobText = job.rawText
      resolvedJobId = job.id
    } else {
      // Auto-create a job record from pasted text
      const job = await prisma.jobDescription.create({
        data: {
          userId,
          title: "Target Role",
          company: "—",
          rawText: jobDescription,
          extractedKeywords: "[]",
        },
      })
      jobText = jobDescription
      resolvedJobId = job.id
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = `You are an expert cover letter writer. Write a compelling, genuine cover letter.
Rules: No clichés ("I am writing to express my interest"). No generic openers.
Start with a hook that shows knowledge of the company or role.
Make it sound human, not AI-generated.
Return ONLY valid JSON (no markdown, no code fences):
{
  "subject_line": "Re: [Role] Application — [Candidate Name]",
  "cover_letter": "<full 3-paragraph professional cover letter>",
  "short_version": "<concise 1-paragraph summary version, 100-130 words>",
  "closing_paragraph": "<strong standalone closing paragraph with clear call to action>",
  "key_selling_points_used": ["point1", "point2", "point3"],
  "personalization_elements": ["element1", "element2"]
}`

    const userMessage = `JOB DESCRIPTION:\n${jobText}\n\nCANDIDATE CV:\n${cv.rawText}\n\nTONE PREFERENCE: ${tone || "professional but personable"}`

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
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId,
        jobId: resolvedJobId,
        type: "cover_letter",
        content: JSON.stringify(result),
      },
    })

    await incrementAICredits(userId)

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "cover_letter_generated",
        properties: JSON.stringify({ jobId: resolvedJobId }),
      },
    })

    return NextResponse.json({
      docId: doc.id,
      coverLetter: result.cover_letter,
      shortVersion: result.short_version,
      closingParagraph: result.closing_paragraph,
      subjectLine: result.subject_line,
      keySellingPoints: result.key_selling_points_used,
      personalizationElements: result.personalization_elements,
    })
  } catch (error) {
    console.error("Cover letter error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
