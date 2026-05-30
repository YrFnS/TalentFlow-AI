'use client';

import dynamic from 'next/dynamic';

const BulkEmailContent = dynamic(() => import('./content'), { ssr: false });

export default function BulkEmailPage() {
  return <BulkEmailContent />;
}
