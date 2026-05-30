// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const AnnouncementsContent = dynamic(() => import('./content'), { ssr: false });

export default function Page() {
  return <AnnouncementsContent />;
}
