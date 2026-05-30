'use client';

import dynamic from 'next/dynamic';

const TalentPoolContent = dynamic(() => import('./content'), { ssr: false });

export default function TalentPoolPage() {
  return <TalentPoolContent />;
}
