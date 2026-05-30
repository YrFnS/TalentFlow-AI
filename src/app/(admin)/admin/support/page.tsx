// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const SupportContent = dynamic(() => import('./content'), { ssr: false });

export default function Page() {
  return <SupportContent />;
}
