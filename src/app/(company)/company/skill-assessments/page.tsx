'use client';
import dynamic from 'next/dynamic';

const SkillAssessmentsContent = dynamic(
  () => import('./content'),
  { ssr: false }
);

export default function SkillAssessmentsPage() {
  return <SkillAssessmentsContent />;
}
