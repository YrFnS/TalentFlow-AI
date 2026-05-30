// @ts-nocheck
'use client'

import dynamic from 'next/dynamic';

const CompanyBillingContent = dynamic(() => import('./content'), { ssr: false });

export default function CompanyBillingPage() {
  return <CompanyBillingContent />;
}
