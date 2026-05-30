'use client';

import dynamic from 'next/dynamic';

const EEOContent = dynamic(() => import('./content'), { ssr: false });

export default function EEOPage() {
  return <EEOContent />;
}
