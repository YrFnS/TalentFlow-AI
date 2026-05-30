// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const SourcingContent = dynamic(() => import('./content'), { ssr: false });

export default function SourcingPage() {
  return <SourcingContent />;
}
