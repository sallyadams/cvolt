import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
}

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
        ...(p.skills.technical ?? []),
        ...(p.skills.soft ?? []),
        ...(p.skills.tools ?? []),
        ...(p.skills.languages ?? []),
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

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("tailored_cvs")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await req.json().catch(() => ({}))
    const { cvId, jobId, jobDescription, jobTitle, companyName } = body as {
      cvId?: string
      jobId?: string
      jobDescription?: string
      jobTitle?: string
      companyName?: string
    }

    if (!cvId) {
      return NextResponse.json({ error: "CV ID is required" }, { status: 400 })
    }
    if (!jobId && !jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Either a saved job or a job description is required" },
        { status: 400 }
      )
    }

    const cv = await prisma.cVDocument.findFirst({ where: { id: cvId, userId } })
    if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 })

    let jobText: string
    let resolvedJobId: string | null = null

    if (jobId) {
      const job = await prisma.jobDescription.findFirst({ where: { id: jobId, userId } })
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
      jobText = job.rawText
      resolvedJobId = job.id
    } else {
      const job = await prisma.jobDescription.create({
        data: {
          userId,
          title: jobTitle?.trim() || "Target Role",
          company: companyName?.trim() || "—",
          rawText: jobDescription!.trim(),
          extractedKeywords: "[]",
        },
      })
      jobText = jobDescription!.trim()
      resolvedJobId = job.id
    }

    let cvText = cv.rawText ?? ""
    if (!cvText || cvText.startsWith("[PDF:")) {
      cvText = cvTextFromParsed(cv.parsedJson ?? "")
    }
    if (!cvText) {
      return NextResponse.json(
        { error: "CV content could not be read. Please re-upload your CV." },
        { status: 422 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })

    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = `You are an expert CV tailoring specialist and ATS optimisation consultant.
Analyse the candidate's CV against the job description and produce a comprehensive tailoring report.

Rules:
- NEVER fabricate experience, skills, or qualifications the candidate does not have
- Reframe and reorder existing experience to match job requirements
- Add missing keywords ONLY where genuinely represented by the candidate's background
- Improve bullet points to be more measurable and impactful (add metrics where plausible from context)
- ATS scores should be realistic estimates (before = score of raw CV vs this JD, after = expected score of tailored version)

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "ats_score_before": <0-100 integer>,
  "ats_score_after": <0-100 integer>,
  "professional_summary": {
    "original": "<exact original summary text, or empty string if none>",
    "tailored": "<rewritten summary optimised for this specific role>"
  },
  "experience": [
    {
      "title": "<job title>",
      "company": "<company name>",
      "dates": "<date range>",
      "bullets_original": ["<original bullet point>"],
      "bullets_tailored": ["<improved bullet with stronger action verb and metric where possible>"]
    }
  ],
  "skills": {
    "original": ["<skill from original CV>"],
    "tailored": ["<reordered/augmented skill list prioritising relevance to this role>"],
    "added": ["<skill newly emphasised or added from candidate background>"],
    "deprioritized": ["<skill moved down or removed as less relevant>"]
  },
  "missing_keywords": ["<important keyword from JD genuinely absent from the CV>"],
  "incorporated_keywords": ["<keyword from JD now included in the tailored CV>"],
  "recruiter_feedback": "<3-5 sentences of honest recruiter-perspective feedback: what is strong, what still needs work, overall impression>",
  "top_changes": ["<specific change made — e.g. 'Rewrote summary to emphasise product mindset'>", "<change 2>", "<change 3>"]
}`

    const userMessage = `JOB TITLE: ${jobTitle?.trim() || "Not specified"}
COMPANY: ${companyName?.trim() || "Not specified"}

JOB DESCRIPTION:
${jobText}

CANDIDATE CV:
${cvText}`

    console.log(`[resume-tailor] Starting for cv=${cvId} user=${userId}`)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const raw = response.content[0]
    if (raw.type !== "text") throw new Error("Unexpected AI response type")

    let result
    try {
      result = JSON.parse(stripCodeFences(raw.text))
    } catch {
      console.error("[resume-tailor] JSON parse failed:", raw.text.slice(0, 500))
      return NextResponse.json({ error: "Failed to analyse CV — please try again" }, { status: 500 })
    }

    const resolvedTitle = jobTitle?.trim() || "Target Role"
    const resolvedCompany = companyName?.trim() || "—"

    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId,
        jobId: resolvedJobId,
        type: "tailored_cv",
        content: JSON.stringify({
          ...result,
          jobTitle: resolvedTitle,
          companyName: resolvedCompany,
          cvTitle: cv.title ?? "My CV",
        }),
      },
    })

    await incrementAICredits(userId)

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "resume_tailored",
        properties: JSON.stringify({
          cvId,
          jobId: resolvedJobId,
          atsGain: (result.ats_score_after ?? 0) - (result.ats_score_before ?? 0),
        }),
      },
    })

    console.log(
      `[resume-tailor] Done. ats ${result.ats_score_before}→${result.ats_score_after} docId=${doc.id}`
    )

    return NextResponse.json({
      docId: doc.id,
      cvTitle: cv.title ?? "My CV",
      jobTitle: resolvedTitle,
      companyName: resolvedCompany,
      ...result,
    })
  } catch (error) {
    console.error("[resume-tailor] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
