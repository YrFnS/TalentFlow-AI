'use client'

import dynamic from 'next/dynamic';

const SkillsContent = dynamic(() => import('./content'), { ssr: false });

export default function CandidateSkillsPage() {
  return <SkillsContent />;
}
