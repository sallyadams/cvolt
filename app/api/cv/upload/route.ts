import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "CV text is required" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    // Parse CV using exact prompt from Part 6.1
    const systemPrompt = `You are a CV parsing engine. Extract structured data from the CV text provided.
Return ONLY valid JSON with this exact structure:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "",
  "experience": [{ "title": "", "company": "", "dates": "", "bullets": [] }],
  "education": [{ "degree": "", "institution": "", "dates": "", "grade": "" }],
  "skills": { "technical": [], "soft": [], "languages": [], "tools": [] },
  "certifications": [],
  "projects": [{ "name": "", "description": "", "technologies": [] }]
}
Do not include any text outside the JSON object.`

    const userMessage = `Parse this CV:\n\n${text}`

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

    let parsedJson
    try {
      parsedJson = JSON.parse(parsedContent.text)
    } catch (err) {
      console.error("Failed to parse AI response:", parsedContent.text)
      return NextResponse.json({ error: "Failed to parse CV" }, { status: 500 })
    }

    // Save to database
    const cv = await prisma.cVDocument.create({
      data: {
        userId: session.user.id,
        rawText: text,
        parsedJson: JSON.stringify(parsedJson),
        title: parsedJson.personal?.name ? `${parsedJson.personal.name}'s CV` : "My CV",
      },
    })

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventName: "cv_uploaded",
        properties: JSON.stringify({ file_type: "text" }),
      },
    })

    return NextResponse.json({
      cvId: cv.id,
      parsed: parsedJson,
    })
  } catch (error) {
    console.error("CV upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}