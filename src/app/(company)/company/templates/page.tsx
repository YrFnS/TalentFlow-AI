// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const TemplatesContent = dynamic(() => import('./content'), { ssr: false });

export default function TemplatesPage() {
  return <TemplatesContent />;
}
