import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const scoreId = resolvedParams.id;

    const score = await prisma.interviewScore.findUnique({
      where: {
        id: scoreId,
        userId: session.user.id,
      },
    });

    if (!score) {
      return NextResponse.json({ error: 'Interview score not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: score.id,
      cvId: score.cvId,
      overallScore: score.overallScore,
      categories: {
        technicalSkills: score.technicalSkills,
        softSkills: score.softSkills,
        experience: score.experience,
        communication: score.communication,
        culturalFit: score.culturalFit,
      },
      strengths: JSON.parse(score.strengths),
      weaknesses: JSON.parse(score.weaknesses),
      recommendations: JSON.parse(score.recommendations),
      createdAt: score.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching interview score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}