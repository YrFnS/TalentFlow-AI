'use client';
import dynamic from 'next/dynamic';

const JobBoardsContent = dynamic(() => import('./content'), { ssr: false });

export default function JobBoardsPage() {
  return <JobBoardsContent />;
}
