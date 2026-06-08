// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { Check, X } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingComparison() {
  const { t } = useI18n();

  const traditionalItems = [
    t.landing.traditional1,
    t.landing.traditional2,
    t.landing.traditional3,
    t.landing.traditional4,
    t.landing.traditional5,
  ];

  const aiItems = [
    t.landing.ai1,
    t.landing.ai2,
    t.landing.ai3,
    t.landing.ai4,
    t.landing.ai5,
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t.landing.comparisonTitle}
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200 rounded-xl overflow-hidden">
              {/* Traditional Hiring */}
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="text-lg font-semibold text-slate-500 mb-6">{t.landing.comparisonTraditional}</h3>
                <ul className="space-y-3">
                  {traditionalItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TalentFlow AI */}
              <div className="p-6 md:p-8 bg-blue-50/50">
                <h3 className="text-lg font-semibold text-blue-700 mb-6">{t.landing.comparisonAI}</h3>
                <ul className="space-y-3">
                  {aiItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
