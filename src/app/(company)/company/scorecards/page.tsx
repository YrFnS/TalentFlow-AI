'use client';

import dynamic from 'next/dynamic';

const ScorecardsContent = dynamic(() => import('./content'), { ssr: false });

export default function ScorecardsPage() {
  return <ScorecardsContent />;
}
