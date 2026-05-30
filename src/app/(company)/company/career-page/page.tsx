'use client';

import dynamic from 'next/dynamic';

const CareerPageSettingsContent = dynamic(() => import('./content'), { ssr: false });

export default function CareerPageSettingsPage() {
  return <CareerPageSettingsContent />;
}
