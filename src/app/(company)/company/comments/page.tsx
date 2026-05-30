'use client';

import dynamic from 'next/dynamic';

const CommentsContent = dynamic(() => import('./content'), { ssr: false });

export default function CommentsPage() {
  return <CommentsContent />;
}
