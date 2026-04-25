import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuthAndFeature } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const JOB_MATCHER_PROMPT = `You are an expert recruiter analyzing CVs for job fit. Compare the provided CV against the job description and provide:

1. Overall Match Score (0-100)
2. Matched Keywords (from job description found in CV)
3. Missing Keywords (important job requirements not found in CV)
4. Skills Match Analysis
5. Experience Level Assessment
6. Recommendations for CV Improvement
7. Interview Likelihood

Return in JSON format:

{
  "matchScore": number,
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "skillsAnalysis": "detailed analysis text",
  "experienceAssessment": "assessment text",
  "recommendations": ["rec1", "rec2", ...],
  "interviewLikelihood": "High/Medium/Low"
}`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAndFeature('job_matcher');
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { jobId, cvId } = await request.json();

    if (!jobId || !cvId) {
      return NextResponse.json(
        { error: 'Job ID and CV ID are required' },
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
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${JOB_MATCHER_PROMPT}

CV Content:
${cv.content}

Job Description:
${job.description}`,
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

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'job_match_performed',
        properties: JSON.stringify({ cvId, jobId, matchScore: parsedResult.matchScore }),
      },
    });

    // Update user credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsed: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Job match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}