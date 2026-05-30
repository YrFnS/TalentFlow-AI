// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const EEOReportsContent = dynamic(() => import('./content'), { ssr: false });

export default function EEOReportsPage() {
  return <EEOReportsContent />;
}
