'use client';

import dynamic from 'next/dynamic';

const ScheduleContent = dynamic(() => import('./content'), { ssr: false });

export default function SchedulePage() {
  return <ScheduleContent />;
}
