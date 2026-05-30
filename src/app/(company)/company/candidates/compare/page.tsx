'use client';

import dynamic from 'next/dynamic';

const CompareContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function ComparePage() {
  return <CompareContent />;
}
