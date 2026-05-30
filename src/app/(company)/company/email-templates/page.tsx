// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const EmailTemplatesContent = dynamic(() => import('./content'), { ssr: false });

export default function EmailTemplatesPage() {
  return <EmailTemplatesContent />;
}
