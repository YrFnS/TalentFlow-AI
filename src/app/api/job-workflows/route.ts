// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default company pipeline stages
const defaultStages = [
  { id: 'applied', name: 'Applied', color: '#6b7280', order: 0 },
  { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1 },
  { id: 'phone-interview', name: 'Phone Interview', color: '#3b82f6', order: 2 },
  { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3 },
  { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4 },
  { id: 'offer', name: 'Offer', color: '#10b981', order: 5 },
  { id: 'hired', name: 'Hired', color: '#059669', order: 6 },
];

// Mock workflow configurations
const mockWorkflows = [
  {
    id: 'wf-1',
    jobId: 'job-1',
    jobTitle: 'Senior Engineer',
    customEnabled: true,
    stages: [
      { id: 'applied', name: 'Applied', color: '#6b7280', order: 0, included: true },
      { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1, included: true },
      { id: 'phone-interview', name: 'Phone Interview', color: '#3b82f6', order: 2, included: false },
      { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3, included: true },
      { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4, included: false },
      { id: 'offer', name: 'Offer', color: '#10b981', order: 5, included: true },
      { id: 'hired', name: 'Hired', color: '#059669', order: 6, included: true },
    ],
    autoAdvanceRules: [
      { id: 'rule-1', condition: 'screening_passed', fromStage: 'screening', toStage: 'technical-interview', enabled: true, threshold: null },
      { id: 'rule-2', condition: 'score_above_threshold', fromStage: 'technical-interview', toStage: 'offer', enabled: true, threshold: 4 },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },
  {
    id: 'wf-2',
    jobId: 'job-2',
    jobTitle: 'Product Designer',
    customEnabled: false,
    stages: defaultStages.map((s) => ({ ...s, included: true })),
    autoAdvanceRules: [],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'wf-3',
    jobId: 'job-3',
    jobTitle: 'Sales Manager',
    customEnabled: true,
    stages: [
      { id: 'applied', name: 'Applied', color: '#6b7280', order: 0, included: true },
      { id: 'screening', name: 'Screening', color: '#f59e0b', order: 1, included: true },
      { id: 'phone-interview', name: 'Phone Interview', color: '#3b82f6', order: 2, included: true },
      { id: 'technical-interview', name: 'Technical Interview', color: '#8b5cf6', order: 3, included: false },
      { id: 'culture-fit', name: 'Culture Fit', color: '#ec4899', order: 4, included: false },
      { id: 'offer', name: 'Offer', color: '#10b981', order: 5, included: true },
      { id: 'hired', name: 'Hired', color: '#059669', order: 6, included: true },
    ],
    autoAdvanceRules: [
      { id: 'rule-3', condition: 'screening_passed', fromStage: 'screening', toStage: 'phone-interview', enabled: true, threshold: null },
    ],
    createdAt: '2024-03-10T11:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z',
  },
  {
    id: 'wf-4',
    jobId: 'job-4',
    jobTitle: 'Marketing Specialist',
    customEnabled: false,
    stages: defaultStages.map((s) => ({ ...s, included: true })),
    autoAdvanceRules: [],
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2024-03-20T08:00:00Z',
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  try {
    // Try to fetch from database first
    if (jobId) {
      const workflow = await db.pipelineStage.findMany({
        where: { companyId: jobId },
        orderBy: { order: 'asc' },
      });
      if (workflow.length > 0) {
        return NextResponse.json({ workflows: mockWorkflows, defaultStages, selectedJobId: jobId });
      }
    }
    // Return mock data
    return NextResponse.json({ workflows: mockWorkflows, defaultStages });
  } catch {
    return NextResponse.json({ workflows: mockWorkflows, defaultStages });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, customEnabled, stages, autoAdvanceRules } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const newWorkflow = {
      id: `wf-${Date.now()}`,
      jobId,
      jobTitle: body.jobTitle || 'Untitled Job',
      customEnabled: customEnabled ?? false,
      stages: stages || defaultStages.map((s) => ({ ...s, included: true })),
      autoAdvanceRules: autoAdvanceRules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ workflow: newWorkflow }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
