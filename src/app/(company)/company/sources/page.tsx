'use client';

import dynamic from 'next/dynamic';

const SourcesContent = dynamic(() => import('./content'), { ssr: false });

export default function SourcesPage() {
  return <SourcesContent />;
}
