// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const JobWorkflowsContent = dynamic(() => import('./content'), { ssr: false });

export default function JobWorkflowsPage() {
  return <JobWorkflowsContent />;
}
