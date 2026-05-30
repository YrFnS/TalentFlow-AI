'use client'

import dynamic from 'next/dynamic';

const AdminBillingContent = dynamic(() => import('./content'), { ssr: false });

export default function AdminBillingPage() {
  return <AdminBillingContent />;
}
