// @ts-nocheck
'use client'

import { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { ArrowUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import LandingHeader from './components/landing-header';
import LandingHero from './components/landing-hero';
import LandingFeatures from './components/landing-features';
import LandingSocialProof from './components/landing-social-proof';
import LandingComparison from './components/landing-comparison';
import LandingHowItWorks from './components/landing-how-it-works';
import LandingIntegrations from './components/landing-integrations';
import LandingPricing from './components/landing-pricing';
import LandingFaq from './components/landing-faq';
import LandingCta from './components/landing-cta';
import LandingFooter from './components/landing-footer';

const AIChatbot = dynamic(() => import('@/components/shared/ai-chatbot'), { ssr: false });

export default function LandingPage() {
  const { dir } = useI18n();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <LandingHeader scrollToSection={scrollToSection} />

      <main className="flex-1">
        <LandingHero scrollToSection={scrollToSection} />
        <LandingFeatures />
        <LandingSocialProof />
        <LandingComparison />
        <LandingHowItWorks />
        <LandingIntegrations />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>

      <LandingFooter />

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-22 end-6 z-40 h-10 w-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center scroll-top-btn"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <AIChatbot />
    </div>
  );
}
