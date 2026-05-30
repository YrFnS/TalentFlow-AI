// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/internal-applications - List internal applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const candidateId = searchParams.get('candidateId');

    if (candidateId) {
      try {
        const applications = await db.internalApplication.findMany({
          where: { candidateId },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ applications });
      } catch {
        // Return empty if DB fails
        return NextResponse.json({ applications: [] });
      }
    }

    if (!companyId) {
      return NextResponse.json({ applications: getMockCandidateApplications() });
    }

    try {
      const postings = await db.internalJobPosting.findMany({
        where: { companyId },
        include: { applications: true, job: { select: { title: true } } },
      });

      const applications = postings.flatMap(p =>
        p.applications.map(a => ({
          ...a,
          jobTitle: p.job.title,
        }))
      );

      return NextResponse.json({ applications });
    } catch {
      return NextResponse.json({ applications: [] });
    }
  } catch (error) {
    console.error('Error fetching internal applications:', error);
    return NextResponse.json({ applications: [] });
  }
}

// PATCH /api/internal-applications - Update application status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action } = body; // action: 'approve' or 'reject'

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'applicationId and action are required' },
        { status: 400 }
      );
    }

    try {
      const updateData: Record<string, unknown> = {};
      if (action === 'approve') {
        updateData.managerApproved = true;
        updateData.status = 'MANAGER_APPROVED';
      } else if (action === 'reject') {
        updateData.managerApproved = false;
        updateData.status = 'REJECTED';
      }

      const updated = await db.internalApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({
        id: applicationId,
        status: action === 'approve' ? 'MANAGER_APPROVED' : 'REJECTED',
        managerApproved: action === 'approve',
      });
    }
  } catch (error) {
    console.error('Error updating internal application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

function getMockCandidateApplications() {
  return [
    { id: 'ia-1', jobId: 'job-1', candidateId: 'cand-1', currentRoleId: 'role-1', managerNotified: true, managerApproved: true, status: 'MANAGER_APPROVED', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), jobTitle: 'Senior Frontend Engineer', postingId: 'ij-1', minTenureMonths: 12, department: 'Engineering', location: 'Remote' },
    { id: 'ia-4', jobId: 'job-2', candidateId: 'cand-4', currentRoleId: 'role-4', managerNotified: true, managerApproved: true, status: 'INTERVIEW', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), jobTitle: 'Product Marketing Manager', postingId: 'ij-2', minTenureMonths: 6, department: 'Marketing', location: 'New York, NY' },
  ];
}
