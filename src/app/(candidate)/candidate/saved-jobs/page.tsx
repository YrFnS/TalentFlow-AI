'use client'

import dynamic from 'next/dynamic';

const SavedJobsContent = dynamic(() => import('./content'), { ssr: false });

export default function SavedJobsPage() {
  return <SavedJobsContent />;
}
