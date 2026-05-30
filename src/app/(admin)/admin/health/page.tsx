// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';

const AdminHealthPage = dynamic(() => import('./content'), { ssr: false });

export default function Page() {
  return <AdminHealthPage />;
}
