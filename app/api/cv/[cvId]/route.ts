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

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(cv);
  } catch (error) {
    console.error('Get CV error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { cvId } = await params;
    const { content, filename } = await request.json();

    const cv = await prisma.cVDocument.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      );
    }

    // Create a new version before updating
    await prisma.cVVersion.create({
      data: {
        cvId,
        content: cv.rawText,
        filename: cv.title || cv.fileUrl || null,
        version: cv.version,
      },
    });

    // Update the CV
    const updatedCv = await prisma.cVDocument.update({
      where: { id: cvId },
      data: {
        rawText: content,
        title: filename || cv.title,
        version: cv.version + 1,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'cv_edited',
        properties: JSON.stringify({ cvId, newVersion: updatedCv.version }),
      },
    });

    return NextResponse.json(updatedCv);
  } catch (error) {
    console.error('Update CV error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}