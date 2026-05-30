'use client';

import dynamic from 'next/dynamic';

const ProfileContent = dynamic(() => import('./content'), { ssr: false });

export default function ProfilePage() {
  return <ProfileContent />;
}
