'use client';

import dynamic from 'next/dynamic';

const QuickApplyContent = dynamic(() => import('./content'), { ssr: false });

export default function QuickApplyPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  return <QuickApplyContent slugPromise={params} />;
}
