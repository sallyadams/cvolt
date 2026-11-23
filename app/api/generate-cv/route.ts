import { NextRequest, NextResponse } from "next/server";
import { CLAUDE_MODEL } from "@/lib/ai-model"
import Anthropic from "@anthropic-ai/sdk";
import { requireAuthAndFeature, incrementAICredits } from "@/lib/middleware";
import { limitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const limited = limitRequest(req, "generate-cv", 10, 60 * 60 * 1000);
  if (limited) return limited;

  // Account + credits required: this route calls the paid Anthropic API.
  const auth = await requireAuthAndFeature("bullets");
  if (auth instanceof NextResponse) {
    const status = auth.status;
    return NextResponse.json(
      {
        success: false,
        error: status === 401 ? "Please create a free account to generate your CV." : "You have used your free AI credits. Upgrade to continue.",
        login_required: status === 401,
        upgrade_required: status === 402,
      },
      { status }
    );
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    const jobTitle = String(body.jobTitle || "").trim().slice(0, 150);
    const jobDescription = String(body.jobDescription || "").trim();

    if (!name || !jobTitle) {
      return NextResponse.json(
        { success: false, error: "Name and job title are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Server missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `You are an expert CV writer. Build an ATS-optimized CV TEMPLATE for this candidate.

Candidate name: ${name}
Target role: ${jobTitle}
${jobDescription ? `\nTarget job description:\n${jobDescription.slice(0, 2000)}` : ""}

IMPORTANT — honesty rules:
- You do NOT know this person's real history. Never invent employers, dates, degrees, numbers or achievements.
- Put every fact the candidate must supply in square brackets, e.g. [Company name], [2022 – present], [X %], [number of clients].
- Bullet points are fill-in templates that show the strongest structure for the target role, with the facts left in brackets.
- The summary and skills may describe the target role and the keywords recruiters expect, but must not claim specific facts.

Return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact structure:
{
  "summary": "2-3 sentences for the target role, with [years of experience] and [key specialty] left in brackets",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6", "skill 7", "skill 8"],
  "experience": [
    {
      "title": "[Most recent job title]",
      "company": "[Company name]",
      "period": "[Start year] – [End year or Present]",
      "bullets": [
        "Action verb + task relevant to the target role + [measurable result]",
        "Action verb + task relevant to the target role + [measurable result]",
        "Action verb + task relevant to the target role + [measurable result]"
      ]
    },
    {
      "title": "[Previous job title]",
      "company": "[Company name]",
      "period": "[Start year] – [End year]",
      "bullets": [
        "Action verb + task + [measurable result]",
        "Action verb + task + [measurable result]"
      ]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: "AI returned unreadable data. Please try again." },
        { status: 500 }
      );
    }

    await incrementAICredits(auth.userId);

    return NextResponse.json({
      success: true,
      data: {
        summary: parsed.summary || "",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      },
    });
  } catch (err) {
    console.error("[generate-cv] error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Generation failed. Please try again.",
      },
      { status: 500 }
    );
  }
}