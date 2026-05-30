'use client'

import dynamic from 'next/dynamic';

const ForgotPasswordContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
