import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-engine';

export async function GET(_request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(WORKFLOW_TEMPLATES);
}
