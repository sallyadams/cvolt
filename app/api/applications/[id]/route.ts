import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { id } = await params;
    const { status, notes, appliedDate } = await request.json();

    const application = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        notes,
        appliedDate: appliedDate ? new Date(appliedDate) : undefined,
      },
      include: {
        jobDescription: true,
        cvDocument: true,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'application_updated',
        properties: JSON.stringify({ applicationId: id, oldStatus: application.status, newStatus: status }),
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const { id } = await params;

    const application = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    await prisma.application.delete({
      where: { id },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: 'application_deleted',
        properties: JSON.stringify({ applicationId: id }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}