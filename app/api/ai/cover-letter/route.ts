import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("cover_letters")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { cv_id, job_id, tone } = await req.json()
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

    // Use exact prompt from Part 6.6
    const systemPrompt = `You are an expert cover letter writer. Write a compelling, genuine cover letter.
Rules: No clichés ("I am writing to express my interest"). No generic openers. 
Start with a hook that shows knowledge of the company or role.
Keep it to 3 paragraphs. Make it sound human, not AI-generated.
Return ONLY valid JSON:
{
  "subject_line": "",
  "cover_letter": "",
  "tone_used": "",
  "key_selling_points_used": [""],
  "personalization_elements": [""]
}`

    const userMessage = `JOB DESCRIPTION:\n${job.rawText}\n\nCANDIDATE CV:\n${cv.rawText}\n\nTONE PREFERENCE: ${tone || "professional but personable"}`

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
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    // Save generated document
    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId: cv_id,
        jobId: job_id,
        type: "cover_letter",
        content: JSON.stringify(result),
      },
    })

    // Increment AI credits for free users
    await incrementAICredits(userId)

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "cover_letter_generated",
        properties: JSON.stringify({ jobId: job_id }),
      },
    })

    return NextResponse.json({
      docId: doc.id,
      ...result,
    })
  } catch (error) {
    console.error("Cover letter error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}