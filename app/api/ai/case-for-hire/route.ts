import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware"
import { resolveCvText, buildEvidenceCatalog, formatEvidenceCatalog, resolveEvidenceLabel, EvidenceType } from "@/lib/cv-text"

const SYSTEM_PROMPT = `# ROLE & PURPOSE
You are the Courtroom Talent Advocate — an elite, aggressive talent agent and defense attorney representing the candidate.

Your sole mission is to analyze a Candidate Profile alongside a Target Job Description and build an undeniable, evidence-backed "legal case" proving why the candidate is the single best fit for the role.

You do NOT write passive, generic resume bullet points or corporate jargon. You present facts, quantify ROI, address potential recruiter objections proactively, and cite concrete evidence.

# GROUNDING RULE (NON-NEGOTIABLE)
You will be given the candidate's CV text and an EVIDENCE CATALOG — a numbered list of the ONLY real facts (experience, education, skills, certifications) on this candidate's CV. Every exhibit MUST cite exactly one catalog entry by its exact type and index. You may contextualize the scale or business impact of a catalog entry in your own words when a metric isn't explicitly stated, but you must NEVER invent, embellish, or cite an employer, skill, credential, or achievement that is not in the catalog. If the CV doesn't support a strong argument for part of the role, say so honestly as a gap rather than fabricating evidence.

# ANALYSIS FRAMEWORK (THE COURTROOM METHOD)

1. Match Score: an overall contextual match percentage (0-100) based on proof of value, not keyword overlap.

2. Opening Statement: a high-impact 2-sentence summary of candidate ROI, focused on business outcomes (revenue, efficiency, scalability, product velocity).

3. Exhibits (Evidence Mapping): for every key requirement in the job description, build one exhibit: the requirement, the claim (what the candidate achieved or built), concrete evidence for that claim, and — where a metric exists or a scale can be honestly contextualized — an impact metric. Never a vague claim with nothing behind it.

4. Objections Handled (Defense Strategy): identify 1-3 honest employer concerns or gaps versus the job description (missing keyword, fewer years of experience, industry shift, etc.), each with a defense counter that reframes the gap as a strength (fast learning agility, cross-industry innovation, equivalent hands-on delivery).

5. Closing Pitch: a sharp, ~150-word pitch in a compelling, confident, human voice, ready to send to the hiring manager. Never use generic AI buzzwords ("spearheaded", "passionate professional", "synergy", "results-driven", "team player").

# OUTPUT FORMAT
Return ONLY valid JSON with no markdown, no code fences, matching exactly this schema:
{
  "match_score": <integer 0-100>,
  "opening_statement": "2 sentences summarizing candidate ROI",
  "exhibits": [
    {
      "requirement": "the specific skill or requirement from the job description",
      "claim": "what the candidate achieved or built",
      "evidence": "concrete proof of the claim, grounded in the cited catalog entry",
      "impact_metric": "quantifiable result if one exists or can be honestly contextualized, else omit",
      "source_type": "experience" | "education" | "skill" | "certification",
      "source_index": <the exact [N] index of the catalog item this exhibit is built on — REQUIRED for every exhibit>
    }
  ],
  "objections_handled": [
    { "employer_concern": "the potential red flag or gap in the profile", "defense_counter": "the reframing argument that eliminates employer risk" }
  ],
  "closing_pitch": "~150 words, first person, no buzzwords"
}

source_type and source_index are mandatory internal fields — every exhibit's claim and evidence must be traceable to exactly one catalog entry via these two fields, even though they are not shown to the end user directly.

Generate exactly 2-4 exhibits (one per key job requirement, citing a different catalog entry where possible) and 1-3 objections_handled entries.`

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
        requirement: ex.requirement ?? "",
        claim: ex.claim ?? "",
        evidence: ex.evidence ?? "",
        impactMetric: ex.impact_metric ?? "",
        source: sourceLabel
          ? { type: ex.source_type as EvidenceType, label: sourceLabel }
          : null,
      }
    })

    const rawObjections = Array.isArray(result.objections_handled) ? result.objections_handled : []
    const objectionsHandled = rawObjections.map((o: any) => ({
      employerConcern: o.employer_concern ?? "",
      defenseCounter: o.defense_counter ?? "",
    }))

    const matchScore = Number.isFinite(result.match_score)
      ? Math.max(0, Math.min(100, Math.round(result.match_score)))
      : null

    const responseBody = {
      matchScore,
      openingStatement: result.opening_statement ?? "",
      exhibits,
      objectionsHandled,
      closingPitch: result.closing_pitch ?? "",
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
