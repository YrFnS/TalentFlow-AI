// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const VideoInterviewContent = dynamic(() => import('./content'), { ssr: false });

export default function VideoInterviewPage() {
  return <VideoInterviewContent />;
}
