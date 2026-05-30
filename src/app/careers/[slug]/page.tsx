// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const CareerPageContent = dynamic(() => import('./content'), { ssr: false });

export default function CareerPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CareerPageContent slugPromise={params} />;
}
