import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        jobDescription: true,
        cvDocument: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;
    const {
      jobId, cvId, status = 'applied', notes, appliedDate,
      company: companyInput, jobTitle: jobTitleInput,
    } = await request.json();

    // Two ways to create an application: linked to an existing parsed
    // JobDescription + CVDocument (used by the full "Add Application" flow),
    // or plain free-text company/jobTitle (used by the tracker's quick-add
    // modal, which never asks the user to pick a CV/job description).
    let company: string;
    let jobTitle: string;

    if (jobId || cvId) {
      if (!jobId || !cvId) {
        return NextResponse.json(
          { error: 'Job ID and CV ID are required together' },
          { status: 400 }
        );
      }

      const job = await prisma.jobDescription.findFirst({ where: { id: jobId, userId } });
      const cv = await prisma.cVDocument.findFirst({ where: { id: cvId, userId } });

      if (!job || !cv) {
        return NextResponse.json(
          { error: 'Job or CV not found' },
          { status: 404 }
        );
      }

      company = job.company || '';
      jobTitle = job.title || '';
    } else {
      company = (companyInput || '').trim();
      jobTitle = (jobTitleInput || '').trim();

      if (!company || !jobTitle) {
        return NextResponse.json(
          { error: 'Company and job title are required' },
          { status: 400 }
        );
      }
    }

    const application = await prisma.application.create({
      data: {
        userId,
        jobId: jobId || null,
        cvId: cvId || null,
        company,
        jobTitle,
        status,
        notes,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
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
        eventName: 'application_created',
        properties: JSON.stringify({ applicationId: application.id, jobId, cvId }),
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}