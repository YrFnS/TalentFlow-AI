// @ts-nocheck
'use client';
import dynamic from 'next/dynamic';

const FairHiringContent = dynamic(() => import('./content'), { ssr: false });

export default function FairHiringPage() {
  return <FairHiringContent />;
}
