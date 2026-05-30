'use client';

import dynamic from 'next/dynamic';

const DirectoryContent = dynamic(() => import('./content'), { ssr: false });

export default function DirectoryPage() {
  return <DirectoryContent />;
}
