'use client';

import dynamic from 'next/dynamic';

const InternalJobsContent = dynamic(() => import('./content'), { ssr: false });

export default function CandidateInternalJobsPage() {
  return <InternalJobsContent />;
}
