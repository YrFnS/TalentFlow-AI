'use client';

import dynamic from 'next/dynamic';

const VideoInterviewsContent = dynamic(() => import('./content'), { ssr: false });

export default function VideoInterviewsPage() {
  return <VideoInterviewsContent />;
}
