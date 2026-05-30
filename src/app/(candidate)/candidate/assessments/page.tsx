// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const AssessmentsContent = dynamic(() => import('./content'), { ssr: false });

export default function AssessmentsPage() {
  return <AssessmentsContent />;
}
