// @ts-nocheck
'use client'

import dynamic from 'next/dynamic';

const CandidateSettingsContent = dynamic(() => import('./content'), { ssr: false });

export default function CandidateSettingsPage() {
  return <CandidateSettingsContent />;
}
