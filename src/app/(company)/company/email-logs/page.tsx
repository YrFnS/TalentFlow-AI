'use client';
import dynamic from 'next/dynamic';

const EmailLogsContent = dynamic(() => import('./content'), { ssr: false });

export default function EmailLogsPage() {
  return <EmailLogsContent />;
}
