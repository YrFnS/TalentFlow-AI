// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const IntegrationsContent = dynamic(() => import('./content'), { ssr: false });

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}
