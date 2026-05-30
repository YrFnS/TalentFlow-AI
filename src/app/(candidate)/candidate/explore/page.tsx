'use client'

import dynamic from 'next/dynamic';

const ExploreContent = dynamic(() => import('./content'), { ssr: false });

export default function ExplorePage() {
  return <ExploreContent />;
}
