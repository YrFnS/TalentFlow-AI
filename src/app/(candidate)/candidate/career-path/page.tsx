// @ts-nocheck
'use client'

import dynamic from 'next/dynamic';

const CareerPathContent = dynamic(() => import('./content'), { ssr: false });

export default function CareerPathPage() {
  return <CareerPathContent />;
}
