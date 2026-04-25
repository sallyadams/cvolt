import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuthAndFeature } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const INTERVIEW_READINESS_PROMPT = `You are an expert career coach specializing in interview preparation. Analyze the provided CV and job description to assess the candidate's interview readiness. Provide a comprehensive evaluation including:

1. Overall Interview Readiness Score (0-100)
2. Category Scores (0-100 each):
   - Technical Skills
   - Soft Skills  
   - Experience
   - Communication
   - Cultural Fit
3. Key Strengths (array of strings)
4. Areas for Improvement/Weaknesses (array of strings)
5. Specific Recommendations (array of strings)

Return the response in the following JSON format:

{
  "overallScore": number,
  "technicalSkills": number,
  "softSkills": number,
  "experience": number,
  "communication": number,
  "culturalFit": number,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["rec1", "rec2", ...]
}`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAndFeature('interview_scores');
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { cvId, jobId } = await request.json();

    if (!cvId || !jobId) {
      return NextResponse.json(
        { error: 'CV ID and Job ID are required' },
        { status: 400 }
      );
    }

    // Fetch CV and job data
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });

    const job = await prisma.jobDescription.findFirst({
      where: { id: jobId, userId },
    });

    if (!cv || !job) {
      return NextResponse.json(
        { error: 'CV or Job not found' },
        { status: 404 }
      );
    }

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${INTERVIEW_READINESS_PROMPT}

CV Content:
${cv.rawText}

Job Description:
${job.rawText}`,
        },
      ],
    });

    const result = response.content[0];
    if (result.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(result.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Save to database
    const interviewScore = await prisma.interviewScore.create({
      data: {
        userId,
        cvId,
        jobId,
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

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'interview_readiness_generated',
        properties: JSON.stringify({ cvId, jobId, scoreId: interviewScore.id }),
      },
    });

    // Update user credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCreditsUsed: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      id: interviewScore.id,
      ...parsedResult,
    });
  } catch (error) {
    console.error('Interview readiness error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}