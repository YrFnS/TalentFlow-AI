'use client';

import dynamic from 'next/dynamic';

const TextApplyContent = dynamic(() => import('./content'), { ssr: false });

export default function TextApplyPage({ params }: { params: Promise<{ token: string }> }) {
  return <TextApplyContent tokenPromise={params} />;
}
