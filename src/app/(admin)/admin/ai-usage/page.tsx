// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const AIUsagePage = dynamic(() => import('./content'), { ssr: false });

export default function Page() {
  return <AIUsagePage />;
}
