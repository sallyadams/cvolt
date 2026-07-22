import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"
import { resolveCvText, buildEvidenceCatalog, formatEvidenceCatalog, resolveEvidenceLabel, EvidenceType } from "@/lib/cv-text"

const SYSTEM_PROMPT = `You are building a "Case for Hire" — a structured, evidence-based argument for why a candidate fits a specific role. It reads like a closing argument, not a cover letter: direct, structured, and grounded only in real facts.

You will be given the candidate's CV text and an EVIDENCE CATALOG — a numbered list of the ONLY facts (experience, education, skills, certifications) you are allowed to cite as evidence. Every "exhibit" you write MUST cite exactly one catalog entry by its exact type and index. Never invent, embellish, or reference any experience, skill, or achievement that is not in the catalog. If the CV doesn't support a strong argument for some part of the role, say so honestly in the objection/response sections rather than fabricating evidence.

Return ONLY valid JSON with no markdown, no code fences:
{
  "employer_problem": "1-2 sentences: what problem is this employer trying to solve by hiring for this role?",
  "candidate_position": "1-2 sentences: the candidate's core value proposition for this problem",
  "exhibits": [
    {
      "title": "short label for what this exhibit demonstrates, e.g. 'Operational reporting'",
      "text": "1-2 sentences making the argument, grounded in the cited evidence",
      "source_type": "experience" | "education" | "skill" | "certification",
      "source_index": <the exact [N] index of the catalog item this exhibit is built on>
    }
  ],
  "potential_objection": "1-2 sentences: the strongest honest reason a hiring manager might hesitate",
  "response": "1-2 sentences: a credible, non-defensive response to that objection using real evidence",
  "closing_argument": "1-2 sentences: why this combination makes the candidate a credible choice"
}

Generate exactly 2-3 exhibits, each citing a different catalog entry where possible.`

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAndFeature("case_for_hire")
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await req.json().catch(() => ({}))
    const { cvId, jobId, jobDescription } = body as { cvId?: string; jobId?: string; jobDescription?: string }

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

    const cvText = resolveCvText(cv)
    if (!cvText) {
      return NextResponse.json(
        { error: "CV content could not be read. Please re-upload your CV." },
        { status: 422 }
      )
    }

    const catalog = buildEvidenceCatalog(cv.parsedJson ?? "")
    const catalogText = formatEvidenceCatalog(catalog)
    if (!catalogText) {
      return NextResponse.json(
        { error: "This CV doesn't have enough structured detail (experience, education, or skills) to build a case for hire. Try re-uploading or editing it first." },
        { status: 422 }
      )
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
      const job = await prisma.jobDescription.create({
        data: {
          userId,
          title: "Target Role",
          company: "—",
          rawText: jobDescription!,
          extractedKeywords: "[]",
        },
      })
      jobText = jobDescription!
      resolvedJobId = job.id
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const userMessage = `JOB DESCRIPTION:\n${jobText}\n\nCANDIDATE CV:\n${cvText}\n\nEVIDENCE CATALOG (cite ONLY these items):\n${catalogText}`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
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
      return NextResponse.json({ error: "Failed to generate case for hire" }, { status: 500 })
    }

    // Resolve every citation against the real catalog server-side — the label shown to the
    // user always comes from the candidate's actual CV data, never from the AI's own text,
    // so a hallucinated or out-of-range citation surfaces as "unverified" rather than as a fact.
    const rawExhibits = Array.isArray(result.exhibits) ? result.exhibits : []
    const exhibits = rawExhibits.map((ex: any, i: number) => {
      const sourceLabel = resolveEvidenceLabel(catalog, ex.source_type, ex.source_index)
      return {
        letter: String.fromCharCode(65 + i), // A, B, C...
        title: ex.title ?? "",
        text: ex.text ?? "",
        source: sourceLabel
          ? { type: ex.source_type as EvidenceType, label: sourceLabel }
          : null,
      }
    })

    const responseBody = {
      employerProblem: result.employer_problem ?? "",
      candidatePosition: result.candidate_position ?? "",
      exhibits,
      potentialObjection: result.potential_objection ?? "",
      response: result.response ?? "",
      closingArgument: result.closing_argument ?? "",
    }

    const doc = await prisma.generatedDocument.create({
      data: {
        userId,
        cvId,
        jobId: resolvedJobId,
        type: "case_for_hire",
        content: JSON.stringify(responseBody),
      },
    })

    await incrementAICredits(userId)

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "case_for_hire_generated",
        properties: JSON.stringify({ jobId: resolvedJobId }),
      },
    })

    return NextResponse.json({ docId: doc.id, ...responseBody })
  } catch (error) {
    console.error("Case for hire error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
