'use client';

import dynamic from 'next/dynamic';

const OnboardingContent = dynamic(() => import('./content'), { ssr: false });

export default function OnboardingPage() {
  return <OnboardingContent />;
}
