import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuthAndFeature } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const INTERVIEW_READINESS_PROMPT = `You are an expert career coach specializing in interview preparation. Analyze the provided CV and job description.

Return ONLY valid JSON (no markdown, no code fences):
{
  "overallScore": <0-100>,
  "technicalSkills": <0-100>,
  "softSkills": <0-100>,
  "experience": <0-100>,
  "communication": <0-100>,
  "culturalFit": <0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "likely_questions": [
    {
      "question": "<specific interview question tailored to this CV and job>",
      "suggested_answer": "<concise suggested answer drawing on the candidate's actual experience from their CV, 2-4 sentences>",
      "tip": "<short coaching tip for delivering this answer well>"
    }
  ]
}

Generate 6 likely_questions that are specific to this candidate's background and this job's requirements.
Mix behavioral (STAR method), technical, and situational questions.`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAndFeature('interview_scores');
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { cvId, jobId, jobDescription } = await request.json();

    if (!cvId || (!jobId && !jobDescription)) {
      return NextResponse.json(
        { error: 'CV ID and either a Job ID or job description text are required' },
        { status: 400 }
      );
    }

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });
    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    let jobText: string;
    let resolvedJobId: string;

    if (jobId) {
      const job = await prisma.jobDescription.findFirst({
        where: { id: jobId, userId },
      });
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      jobText = job.rawText;
      resolvedJobId = job.id;
    } else {
      const job = await prisma.jobDescription.create({
        data: {
          userId,
          title: 'Target Role',
          company: '—',
          rawText: jobDescription,
          extractedKeywords: '[]',
        },
      });
      jobText = jobDescription;
      resolvedJobId = job.id;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${INTERVIEW_READINESS_PROMPT}\n\nCV Content:\n${cv.rawText}\n\nJob Description:\n${jobText}`,
        },
      ],
    });

    const result = response.content[0];
    if (result.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let parsedResult;
    try {
      const text = result.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      parsedResult = JSON.parse(text);
    } catch {
      console.error('Failed to parse AI response:', result.text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const interviewScore = await prisma.interviewScore.create({
      data: {
        userId,
        cvId,
        jobId: resolvedJobId,
        overallScore: parsedResult.overallScore,
        technicalSkills: parsedResult.technicalSkills,
        softSkills: parsedResult.softSkills,
        experience: parsedResult.experience,
        communication: parsedResult.communication,
        culturalFit: parsedResult.culturalFit,
        strengths: JSON.stringify(parsedResult.strengths),
        weaknesses: JSON.stringify(parsedResult.weaknesses),
        recommendations: JSON.stringify(parsedResult.recommendations),
      },
    });

    // Store Q&A separately in generatedDocument so the results page can retrieve it
    if (parsedResult.likely_questions?.length) {
      await prisma.generatedDocument.create({
        data: {
          userId,
          cvId,
          jobId: resolvedJobId,
          type: 'interview_questions',
          content: JSON.stringify(parsedResult.likely_questions),
        },
      });
    }

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'interview_readiness_generated',
        properties: JSON.stringify({ cvId, jobId: resolvedJobId, scoreId: interviewScore.id }),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: 1 } },
    });

    return NextResponse.json({
      id: interviewScore.id,
      overallScore: parsedResult.overallScore,
      technicalSkills: parsedResult.technicalSkills,
      softSkills: parsedResult.softSkills,
      experience: parsedResult.experience,
      communication: parsedResult.communication,
      culturalFit: parsedResult.culturalFit,
      strengths: parsedResult.strengths,
      weaknesses: parsedResult.weaknesses,
      recommendations: parsedResult.recommendations,
      likelyQuestions: parsedResult.likely_questions ?? [],
    });
  } catch (error) {
    console.error('Interview readiness error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
