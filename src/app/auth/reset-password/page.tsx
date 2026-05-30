// @ts-nocheck
'use client'

import dynamic from 'next/dynamic';

const ResetPasswordContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
