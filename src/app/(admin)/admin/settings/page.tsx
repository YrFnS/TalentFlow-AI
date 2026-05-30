'use client'

import dynamic from 'next/dynamic';

const AdminSettingsContent = dynamic(() => import('./content'), { ssr: false });

export default function AdminSettingsPage() {
  return <AdminSettingsContent />;
}
