'use client';

import dynamic from 'next/dynamic';

const ReferenceChecksContent = dynamic(() => import('./content'), { ssr: false });

export default function ReferenceChecksPage() {
  return <ReferenceChecksContent />;
}
