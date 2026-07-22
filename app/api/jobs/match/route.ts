import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuthAndFeature, incrementAICredits } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { resolveCvText } from '@/lib/cv-text';

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
}

const JOB_MATCHER_PROMPT = `You are an expert recruiter analyzing CVs for job fit. Compare the provided CV against the job description and provide:

1. Overall Match Score (0-100)
2. Matched Keywords (from job description found in CV)
3. Missing Keywords (important job requirements not found in CV)
4. Skills Match Analysis
5. Experience Match Assessment
6. Key Strengths for this role
7. Key Weaknesses / gaps for this role
8. Recommended Improvements to the CV
9. Interview Likelihood

Return ONLY valid JSON with NO markdown, NO code fences, NO extra text — just the raw JSON object:

{
  "matchScore": number,
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "skillsMatch": "detailed analysis text",
  "experienceMatch": "assessment text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "interviewLikelihood": "High/Medium/Low"
}`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAndFeature('job_matcher');
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;

    const body = await request.json().catch(() => ({}));
    const { jobId, cvId } = body as { jobId?: string; cvId?: string };

    if (!jobId || !cvId) {
      return NextResponse.json(
        { error: 'Job ID and CV ID are required' },
        { status: 400 }
      );
    }

    // Fetch CV and job data — each scoped to the logged-in user so a stale
    // or foreign ID can never leak another user's document.
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found. It may have been deleted, or does not belong to your account.' },
        { status: 404 }
      );
    }

    const job = await prisma.jobDescription.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job description not found. It may have been deleted, or does not belong to your account.' },
        { status: 404 }
      );
    }

    const cvText = resolveCvText(cv);

    if (!cvText) {
      return NextResponse.json(
        { error: 'CV content could not be read. Please re-upload your CV.' },
        { status: 422 }
      );
    }

    if (!job.rawText) {
      return NextResponse.json(
        { error: 'This job description has no content to match against.' },
        { status: 422 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[jobs/match] ANTHROPIC_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `${JOB_MATCHER_PROMPT}

CV Content:
${cvText}

Job Description:
${job.rawText}`,
          },
        ],
      });
    } catch (apiError) {
      console.error('[jobs/match] Anthropic API error:', apiError);
      if (apiError instanceof Anthropic.APIError) {
        if (apiError.status === 429) {
          return NextResponse.json(
            { error: 'AI service is busy right now. Please try again in a moment.' },
            { status: 503 }
          );
        }
        return NextResponse.json(
          { error: 'AI service is temporarily unavailable. Please try again shortly.' },
          { status: 502 }
        );
      }
      throw apiError;
    }

    const result = response.content[0];
    if (result.type !== 'text') {
      console.error('[jobs/match] Unexpected response content type:', result.type);
      return NextResponse.json(
        { error: 'AI returned an unexpected response. Please try again.' },
        { status: 502 }
      );
    }

    let parsedResult: {
      matchScore?: number;
      matchedKeywords?: string[];
      missingKeywords?: string[];
      skillsMatch?: string;
      experienceMatch?: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      interviewLikelihood?: string;
    };
    try {
      parsedResult = JSON.parse(stripCodeFences(result.text));
    } catch (parseError) {
      console.error('[jobs/match] Failed to parse AI response:', result.text.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to analyze the match. Please try again.' },
        { status: 502 }
      );
    }

    // Guard against the AI omitting a field so the results page never crashes.
    const safeResult = {
      matchScore: typeof parsedResult.matchScore === 'number' ? parsedResult.matchScore : 0,
      matchedKeywords: Array.isArray(parsedResult.matchedKeywords) ? parsedResult.matchedKeywords : [],
      missingKeywords: Array.isArray(parsedResult.missingKeywords) ? parsedResult.missingKeywords : [],
      skillsMatch: typeof parsedResult.skillsMatch === 'string' ? parsedResult.skillsMatch : '',
      experienceMatch: typeof parsedResult.experienceMatch === 'string' ? parsedResult.experienceMatch : '',
      strengths: Array.isArray(parsedResult.strengths) ? parsedResult.strengths : [],
      weaknesses: Array.isArray(parsedResult.weaknesses) ? parsedResult.weaknesses : [],
      recommendations: Array.isArray(parsedResult.recommendations) ? parsedResult.recommendations : [],
      interviewLikelihood: typeof parsedResult.interviewLikelihood === 'string' ? parsedResult.interviewLikelihood : 'Medium',
    };

    // Track analytics and spend the AI credit — failures here shouldn't hide
    // a match result the user already received from the AI.
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventName: 'job_match_performed',
          properties: JSON.stringify({ cvId, jobId, matchScore: safeResult.matchScore }),
        },
      });
      await incrementAICredits(userId);
    } catch (dbError) {
      console.error('[jobs/match] Failed to record analytics/credits:', dbError);
    }

    return NextResponse.json(safeResult);
  } catch (error) {
    console.error('[jobs/match] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while matching your CV. Please try again.' },
      { status: 500 }
    );
  }
}
