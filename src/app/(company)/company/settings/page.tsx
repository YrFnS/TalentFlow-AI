// @ts-nocheck
'use client'

import dynamic from 'next/dynamic';

const CompanySettingsContent = dynamic(() => import('./content'), { ssr: false });

export default function CompanySettingsPage() {
  return <CompanySettingsContent />;
}
