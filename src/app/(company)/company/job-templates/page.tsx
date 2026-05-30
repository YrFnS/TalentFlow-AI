'use client';

import dynamic from 'next/dynamic';

const JobTemplatesContent = dynamic(() => import('./content'), { ssr: false });

export default function JobTemplatesPage() {
  return <JobTemplatesContent />;
}
