// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { User, Building2, Brain, Sparkles } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingHowItWorks() {
  const { t } = useI18n();

  const steps = [
    { title: t.landing.step1, desc: t.landing.step1Desc, icon: User },
    { title: t.landing.step2, desc: t.landing.step2Desc, icon: Building2 },
    { title: t.landing.step3, desc: t.landing.step3Desc, icon: Brain },
    { title: t.landing.step4, desc: t.landing.step4Desc, icon: Sparkles },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t.landing.howItWorks}
          </h2>
          <p className="text-slate-600 text-lg">
            Get started in minutes, not weeks.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-300" />
                )}
                <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center mb-5">
                  <step.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
