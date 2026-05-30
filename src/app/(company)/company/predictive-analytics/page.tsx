// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const PredictiveAnalyticsContent = dynamic(() => import('./content'), { ssr: false });

export default function PredictiveAnalyticsPage() {
  return <PredictiveAnalyticsContent />;
}
