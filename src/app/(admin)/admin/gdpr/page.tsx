// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const GdprContent = dynamic(() => import('./content'), { ssr: false });

export default function GdprPage() {
  return <GdprContent />;
}
