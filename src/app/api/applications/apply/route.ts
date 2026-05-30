import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from '@/lib/email-service';
import { validateInput, applySchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Zod schema validation
    const validation = validateInput(applySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { candidateId, jobId, coverLetter } = validation.data;
    const { source } = body;

    // Check if the job exists and is open
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check if candidate already applied
    const existingApplication = await db.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Get the first pipeline stage for the company
    const firstStage = job.company.stages[0];

    // Create the application
    const application = await db.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter: coverLetter || null,
        source: source || 'direct',
        currentStageId: firstStage?.id || null,
      },
    });

    // Create the first application stage entry
    if (firstStage) {
      await db.applicationStage.create({
        data: {
          applicationId: application.id,
          stageId: firstStage.id,
        },
      });
    }

    // Send application confirmation email to candidate
    try {
      const candidateProfile = await db.candidateProfile.findUnique({
        where: { id: candidateId },
        include: { user: true },
      });
      if (candidateProfile?.user?.email) {
        const emailBody = BUILTIN_EMAIL_TEMPLATES.applicationReceived(
          candidateProfile.user.name,
          job.title,
          job.company.name
        );
        await sendEmail({
          to: candidateProfile.user.email,
          subject: `Application Received — ${job.title} at ${job.company.name}`,
          body: emailBody,
          companyId: job.companyId,
          userId: candidateProfile.userId,
        });
      }
    } catch (emailError) {
      console.error('[Apply] Failed to send application confirmation email:', emailError);
      // Don't fail the application if email fails
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const status = searchParams.get('status');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { candidateId };
    if (status) {
      where.status = status;
    }

    const applications = await db.application.findMany({
      where,
      include: {
        job: {
          include: {
            company: {
              select: { name: true, logo: true, location: true },
            },
          },
        },
        currentStage: true,
        applicationStages: {
          include: {
            stage: true,
          },
          orderBy: { enteredAt: 'asc' },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        status: app.status,
        coverLetter: app.coverLetter,
        matchScore: app.matchScore,
        aiAnalysis: app.aiAnalysis,
        source: app.source,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        job: {
          id: app.job.id,
          title: app.job.title,
          location: app.job.location,
          jobType: app.job.jobType,
          salaryMin: app.job.salaryMin,
          salaryMax: app.job.salaryMax,
          company: app.job.company,
        },
        currentStage: app.currentStage,
        timeline: app.applicationStages.map((stage) => ({
          id: stage.id,
          stageName: stage.stage.name,
          stageColor: stage.stage.color,
          enteredAt: stage.enteredAt,
          exitedAt: stage.exitedAt,
          notes: stage.notes,
        })),
        interviews: app.interviews,
      })),
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { applicationId, action } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const application = await db.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'withdraw': {
        const updatedApp = await db.application.update({
          where: { id: applicationId },
          data: { status: 'WITHDRAWN' },
        });

        // Exit the current stage
        if (application.currentStageId) {
          await db.applicationStage.updateMany({
            where: {
              applicationId,
              stageId: application.currentStageId,
              exitedAt: null,
            },
            data: { exitedAt: new Date() },
          });
        }

        return NextResponse.json({
          message: 'Application withdrawn successfully',
          application: updatedApp,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
