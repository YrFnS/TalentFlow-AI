// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { Zap, BarChart3, Brain, Shield } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingSocialProof() {
  const { t } = useI18n();

  const statsData = [
    { value: t.landing.statsSatisfaction, desc: t.landing.statsSatisfactionDesc, icon: Zap },
    { value: t.landing.statsFaster, desc: t.landing.statsFasterDesc, icon: BarChart3 },
    { value: t.landing.statsScreenings, desc: t.landing.statsScreeningsDesc, icon: Brain },
    { value: t.landing.statsUptime, desc: t.landing.statsUptimeDesc, icon: Shield },
  ];

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <p className="text-sm text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
