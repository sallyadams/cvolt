import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const jobTitle = String(body.jobTitle || "").trim();
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

    const prompt = `You are an expert CV writer. Generate an ATS-optimized CV for this candidate.

Candidate name: ${name}
Target role: ${jobTitle}
${jobDescription ? `\nTarget job description:\n${jobDescription.slice(0, 2000)}` : ""}

Return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact structure:
{
  "summary": "2-3 punchy sentences about the candidate, starting with a power word, mentioning the target role",
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6", "skill 7", "skill 8"],
  "experience": [
    {
      "title": "realistic senior role for this field",
      "company": "Realistic company name",
      "period": "2022 - Present",
      "bullets": [
        "Action verb + specific achievement with a number",
        "Action verb + specific achievement with a number",
        "Action verb + specific achievement with a number"
      ]
    },
    {
      "title": "realistic earlier role",
      "company": "Another company name",
      "period": "2019 - 2022",
      "bullets": [
        "Action verb + achievement with a number",
        "Action verb + achievement with a number"
      ]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
        error: err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}