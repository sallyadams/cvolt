import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { cvId } = await params;

    // Verify CV belongs to user
    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      );
    }

    const versions = await prisma.cVVersion.findMany({
      where: { cvId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Get CV versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}