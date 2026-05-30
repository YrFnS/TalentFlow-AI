'use client'

import dynamic from 'next/dynamic';

const JobSearchContent = dynamic(() => import('./content'), { ssr: false });

export default function JobSearchPage() {
  return <JobSearchContent />;
}
