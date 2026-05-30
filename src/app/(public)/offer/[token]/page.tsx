'use client';

import dynamic from 'next/dynamic';

const OfferSignContent = dynamic(() => import('./content'), { ssr: false });

export default function OfferSignPage() {
  return <OfferSignContent />;
}
