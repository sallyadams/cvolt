import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const systemPrompt = `You are a CV parsing engine. Extract structured data from the CV provided.
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const body = await req.json()
    const { text, pdfBase64, fileName } = body as {
      text?: string
      pdfBase64?: string
      fileName?: string
    }

    if (!text && !pdfBase64) {
      return NextResponse.json({ error: "CV content is required" }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey })

    let rawText: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userContent: any[]

    if (pdfBase64) {
      rawText = `[PDF: ${fileName ?? "uploaded.pdf"}]`
      userContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64,
          },
        },
        {
          type: "text",
          text: "Parse this CV document and extract the structured data.",
        },
      ]
    } else {
      rawText = text as string
      if (!rawText.trim()) {
        return NextResponse.json({ error: "CV text cannot be empty" }, { status: 400 })
      }
      userContent = [{ type: "text", text: `Parse this CV:\n\n${rawText}` }]
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    })

    const parsedContent = response.content[0]
    if (parsedContent.type !== "text") {
      throw new Error("Unexpected response type from AI")
    }

    let parsedJson
    try {
      // Strip markdown code fences if present
      const cleaned = parsedContent.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()
      parsedJson = JSON.parse(cleaned)
    } catch {
      console.error("Failed to parse AI response:", parsedContent.text)
      return NextResponse.json({ error: "Failed to parse CV — please try again" }, { status: 500 })
    }

    const cv = await prisma.cVDocument.create({
      data: {
        userId: session.user.id,
        rawText,
        parsedJson: JSON.stringify(parsedJson),
        title: parsedJson.personal?.name
          ? `${parsedJson.personal.name}'s CV`
          : "My CV",
      },
    })

    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventName: "cv_uploaded",
        properties: JSON.stringify({ file_type: pdfBase64 ? "pdf" : "text" }),
      },
    })

    return NextResponse.json({ cvId: cv.id, parsed: parsedJson })
  } catch (error) {
    console.error("CV upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
