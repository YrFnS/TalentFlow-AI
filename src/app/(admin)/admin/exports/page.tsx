// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const ExportsContent = dynamic(() => import('./content'), { ssr: false });

export default function ExportsPage() {
  return <ExportsContent />;
}
