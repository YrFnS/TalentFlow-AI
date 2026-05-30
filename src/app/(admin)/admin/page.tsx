// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const AdminContent = dynamic(() => import('./content'), { ssr: false });

export default function AdminPage() {
  return <AdminContent />;
}
