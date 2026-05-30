// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const SecurityContent = dynamic(() => import('./content'), { ssr: false });

export default function SecurityPage() {
  return <SecurityContent />;
}
