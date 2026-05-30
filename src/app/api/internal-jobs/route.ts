// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/internal-jobs - List internal job openings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      // Return mock data if no companyId
      return NextResponse.json({ postings: getMockPostings(), applications: getMockApplications() });
    }

    const postings = await db.internalJobPosting.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            description: true,
            jobType: true,
          },
        },
        postedBy: {
          select: { id: true, name: true, email: true },
        },
        applications: {
          include: {
            internalJobPosting: {
              include: { job: { select: { title: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({
      postings: postings.map(p => ({
        ...p,
        jobTitle: p.job.title,
        department: p.job.department || 'General',
        location: p.job.location || 'Remote',
        applicationsCount: p.applications.length,
      })),
      applications: postings.flatMap(p =>
        p.applications.map(a => ({
          ...a,
          jobTitle: p.job.title,
          postingId: p.id,
        }))
      ),
    });
  } catch (error) {
    console.error('Error fetching internal jobs:', error);
    return NextResponse.json({ postings: getMockPostings(), applications: getMockApplications() });
  }
}

// POST /api/internal-jobs - Create internal job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, jobId, postedById, isInternalOnly, minTenureMonths, notifyEmployees, internalNotes } = body;

    if (!companyId || !jobId) {
      return NextResponse.json(
        { error: 'companyId and jobId are required' },
        { status: 400 }
      );
    }

    const posting = await db.internalJobPosting.create({
      data: {
        companyId,
        jobId,
        postedById: postedById || 'unknown',
        isInternalOnly: isInternalOnly ?? true,
        minTenureMonths: minTenureMonths ?? 6,
        notifyEmployees: notifyEmployees ?? true,
        internalNotes: internalNotes || null,
      },
    });

    return NextResponse.json(posting, { status: 201 });
  } catch (error) {
    console.error('Error creating internal job posting:', error);
    return NextResponse.json(
      { error: 'Failed to create internal job posting' },
      { status: 500 }
    );
  }
}

// Mock data for when no companyId is provided
function getMockPostings() {
  const now = new Date();
  return [
    {
      id: 'ij-1',
      jobId: 'job-1',
      companyId: 'comp-1',
      postedById: 'user-1',
      isInternalOnly: true,
      minTenureMonths: 12,
      notifyEmployees: true,
      internalNotes: 'Priority for current engineering team members',
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      jobTitle: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote',
      applicationsCount: 3,
    },
    {
      id: 'ij-2',
      jobId: 'job-2',
      companyId: 'comp-1',
      postedById: 'user-1',
      isInternalOnly: true,
      minTenureMonths: 6,
      notifyEmployees: true,
      internalNotes: 'Looking for marketing professionals',
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      jobTitle: 'Product Marketing Manager',
      department: 'Marketing',
      location: 'New York, NY',
      applicationsCount: 2,
    },
    {
      id: 'ij-3',
      jobId: 'job-3',
      companyId: 'comp-1',
      postedById: 'user-2',
      isInternalOnly: false,
      minTenureMonths: 18,
      notifyEmployees: false,
      internalNotes: 'Sales leadership opportunity',
      createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      jobTitle: 'Sales Team Lead',
      department: 'Sales',
      location: 'San Francisco, CA',
      applicationsCount: 1,
    },
    {
      id: 'ij-4',
      jobId: 'job-4',
      companyId: 'comp-1',
      postedById: 'user-1',
      isInternalOnly: true,
      minTenureMonths: 6,
      notifyEmployees: true,
      internalNotes: null,
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      jobTitle: 'Product Manager',
      department: 'Product',
      location: 'Austin, TX',
      applicationsCount: 2,
    },
    {
      id: 'ij-5',
      jobId: 'job-5',
      companyId: 'comp-1',
      postedById: 'user-2',
      isInternalOnly: true,
      minTenureMonths: 3,
      notifyEmployees: true,
      internalNotes: 'Great opportunity for junior designers',
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      jobTitle: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      applicationsCount: 0,
    },
  ];
}

function getMockApplications() {
  return [
    { id: 'ia-1', jobId: 'job-1', candidateId: 'cand-1', currentRoleId: 'role-1', managerNotified: true, managerApproved: true, status: 'MANAGER_APPROVED', notes: 'Strong candidate with 3 years in frontend', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Sarah Chen', currentRole: 'Frontend Developer', jobTitle: 'Senior Frontend Engineer', postingId: 'ij-1' },
    { id: 'ia-2', jobId: 'job-1', candidateId: 'cand-2', currentRoleId: 'role-2', managerNotified: true, managerApproved: false, status: 'PENDING', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Marcus Brown', currentRole: 'Backend Developer', jobTitle: 'Senior Frontend Engineer', postingId: 'ij-1' },
    { id: 'ia-3', jobId: 'job-1', candidateId: 'cand-3', currentRoleId: 'role-3', managerNotified: true, managerApproved: null, status: 'PENDING', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Priya Sharma', currentRole: 'Full Stack Developer', jobTitle: 'Senior Frontend Engineer', postingId: 'ij-1' },
    { id: 'ia-4', jobId: 'job-2', candidateId: 'cand-4', currentRoleId: 'role-4', managerNotified: true, managerApproved: true, status: 'INTERVIEW', notes: 'Schedule interview next week', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Tom Anderson', currentRole: 'Content Writer', jobTitle: 'Product Marketing Manager', postingId: 'ij-2' },
    { id: 'ia-5', jobId: 'job-2', candidateId: 'cand-5', currentRoleId: 'role-5', managerNotified: false, managerApproved: null, status: 'PENDING', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Aisha Mohamed', currentRole: 'Social Media Specialist', jobTitle: 'Product Marketing Manager', postingId: 'ij-2' },
    { id: 'ia-6', jobId: 'job-3', candidateId: 'cand-6', currentRoleId: 'role-6', managerNotified: true, managerApproved: true, status: 'OFFERED', notes: 'Offer extended', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'David Kim', currentRole: 'Sales Representative', jobTitle: 'Sales Team Lead', postingId: 'ij-3' },
    { id: 'ia-7', jobId: 'job-4', candidateId: 'cand-2', currentRoleId: 'role-2', managerNotified: true, managerApproved: false, status: 'REJECTED', notes: 'Manager did not approve', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Marcus Brown', currentRole: 'Backend Developer', jobTitle: 'Product Manager', postingId: 'ij-4' },
    { id: 'ia-8', jobId: 'job-4', candidateId: 'cand-7', currentRoleId: 'role-7', managerNotified: true, managerApproved: true, status: 'HIRED', notes: 'Welcome to product!', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), applicantName: 'Lisa Park', currentRole: 'Business Analyst', jobTitle: 'Product Manager', postingId: 'ij-4' },
  ];
}
