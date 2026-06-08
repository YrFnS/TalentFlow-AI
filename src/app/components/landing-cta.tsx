// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingCta() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <section className="py-20 md:py-28 bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.landing.cta}</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">{t.landing.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 h-12"
              onClick={() => router.push('/auth/register')}
            >
              {t.landing.getStarted}
              <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-12"
              onClick={() => router.push('/candidate/jobs')}
            >
              {t.landing.viewJobs}
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
