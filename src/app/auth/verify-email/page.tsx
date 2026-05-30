'use client'

import dynamic from 'next/dynamic';

const VerifyEmailContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
