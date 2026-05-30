// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const RiskAnalysisContent = dynamic(() => import('./content'), { ssr: false });

export default function RiskAnalysisPage() {
  return <RiskAnalysisContent />;
}
