'use client'

import dynamic from 'next/dynamic';

const JobDetailContent = dynamic(() => import('./content'), { ssr: false });

export default function JobDetailPage() {
  return <JobDetailContent />;
}
