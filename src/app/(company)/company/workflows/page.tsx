'use client';

import dynamic from 'next/dynamic';

const WorkflowsContent = dynamic(() => import('./content'), { ssr: false });

export default function WorkflowsPage() {
  return <WorkflowsContent />;
}
