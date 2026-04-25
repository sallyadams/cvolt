import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

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
      return NextResponse.json({ error: "Failed to tailor CV" }, { status: 500 })
    }

    // Save tailored CV as new version
    const tailoredCV = await prisma.cVDocument.create({
      data: {
        userId,
        title: `${cv.title} (Tailored for ${job.title})`,
        rawText: JSON.stringify(result), // Store tailored version as raw text
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

    return NextResponse.json({
      cvId: tailoredCV.id,
      docId: doc.id,
      tailoredCV: result,
    })
  } catch (error) {
    console.error("Tailor CV error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}