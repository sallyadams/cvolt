import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"

function safeParse(json: string) {
  try { return JSON.parse(json) } catch { return null }
}

export const COACH_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_cvs",
    description: "List the job seeker's uploaded CVs (id, title, version, when created). Call this first if you need a cvId for get_cv.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_cv",
    description: "Get the full text content of one of the job seeker's CVs by id.",
    input_schema: {
      type: "object",
      properties: { cvId: { type: "string", description: "The CV id, from list_cvs" } },
      required: ["cvId"],
    },
  },
  {
    name: "get_latest_ats_scan",
    description: "Get the job seeker's most recent ATS (applicant tracking system) scan: overall score, keyword matches, formatting issues, and recommendations.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_recent_interview_scores",
    description: "Get the job seeker's most recent interview readiness scores, including strengths, weaknesses, and recommendations from up to their last 3 practice sessions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_application_pipeline",
    description: "Get the job seeker's tracked job applications: company, job title, status (saved/applied/screening/interview/offer/rejected), and next actions.",
    input_schema: { type: "object", properties: {} },
  },
]

export async function executeCoachTool(userId: string, name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case "list_cvs": {
      return prisma.cVDocument.findMany({
        where: { userId, isActive: true },
        select: { id: true, title: true, version: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
    }

    case "get_cv": {
      const { cvId } = input as { cvId?: string }
      if (!cvId) return { error: "cvId is required" }
      const cv = await prisma.cVDocument.findFirst({
        where: { id: cvId, userId },
        select: { title: true, rawText: true },
      })
      if (!cv) return { error: "CV not found" }
      return { title: cv.title, content: cv.rawText.slice(0, 6000) }
    }

    case "get_latest_ats_scan": {
      const scan = await prisma.aTSScan.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      if (!scan) return { message: "No ATS scan found yet — the user hasn't run one." }
      return {
        overallScore: scan.overallScore,
        keywordMatches: safeParse(scan.keywordMatches),
        formatIssues: safeParse(scan.formatIssues),
        recommendations: safeParse(scan.recommendations),
        createdAt: scan.createdAt,
      }
    }

    case "get_recent_interview_scores": {
      const scores = await prisma.interviewScore.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
      return scores.map((s) => ({
        overallScore: s.overallScore,
        technicalSkills: s.technicalSkills,
        softSkills: s.softSkills,
        experience: s.experience,
        communication: s.communication,
        culturalFit: s.culturalFit,
        strengths: safeParse(s.strengths),
        weaknesses: safeParse(s.weaknesses),
        recommendations: safeParse(s.recommendations),
        createdAt: s.createdAt,
      }))
    }

    case "get_application_pipeline": {
      const applications = await prisma.application.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { company: true, jobTitle: true, status: true, appliedDate: true, nextAction: true, nextActionDate: true },
      })
      return applications
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
