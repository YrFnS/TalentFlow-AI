import { NextRequest, NextResponse } from 'next/server';

// Mock workflows (same as parent route)
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
    stages: [],
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
    stages: [],
    autoAdvanceRules: [],
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2024-03-20T08:00:00Z',
  },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = mockWorkflows.find((w) => w.id === id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
  return NextResponse.json({ workflow });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = mockWorkflows.find((w) => w.id === id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = {
      ...workflow,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ workflow: updated });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = mockWorkflows.find((w) => w.id === id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
