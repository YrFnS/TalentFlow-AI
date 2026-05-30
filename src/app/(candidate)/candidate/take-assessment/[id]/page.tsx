'use client';
import dynamic from 'next/dynamic';

const TakeAssessmentContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function TakeAssessmentPage() {
  return <TakeAssessmentContent />;
}
