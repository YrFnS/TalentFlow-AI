// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const CalendarContent = dynamic(() => import('./content'), { ssr: false });

export default function CalendarPage() {
  return <CalendarContent />;
}
