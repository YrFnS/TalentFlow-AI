'use client';

import dynamic from 'next/dynamic';

const OffersContent = dynamic(() => import('./content'), { ssr: false });

export default function OffersPage() {
  return <OffersContent />;
}
