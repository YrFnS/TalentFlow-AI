// @ts-nocheck
'use client'

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, GitBranch, Video, Target, Globe, Settings2 } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingFeatures() {
  const { t } = useI18n();

  const features = [
    { icon: Brain, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: GitBranch, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: Video, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: Target, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
    { icon: Globe, title: t.landing.feature5Title, desc: t.landing.feature5Desc },
    { icon: Settings2, title: t.landing.feature6Title, desc: t.landing.feature6Desc },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t.landing.features}
          </h2>
          <p className="text-slate-600 text-lg">
            Everything you need to manage the full hiring lifecycle — from sourcing to offer.
          </p>
        </AnimateOnScroll>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Wide card: AI Screening (spans 2 cols) */}
          <AnimateOnScroll className="md:col-span-2" delay={0.1}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    {features[0].icon && React.createElement(features[0].icon, { className: "w-5 h-5 text-blue-600" })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[0].title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{features[0].desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Tall card: Pipeline */}
          <AnimateOnScroll className="md:row-span-2" delay={0.2}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                  {features[1].icon && React.createElement(features[1].icon, { className: "w-5 h-5 text-emerald-600" })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[1].title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{features[1].desc}</p>
                {/* Mini pipeline visual */}
                <div className="space-y-2">
                  {['Applied', 'Screening', 'Interview', 'Offer'].map((stage, i) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-xs text-slate-600 font-medium">{stage}</span>
                      {i < 3 && <div className="flex-1 h-px bg-slate-200" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Small card: Interview Intelligence */}
          <AnimateOnScroll delay={0.15}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                  {features[2].icon && React.createElement(features[2].icon, { className: "w-5 h-5 text-amber-600" })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[2].title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{features[2].desc}</p>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Small card: Skill Gap */}
          <AnimateOnScroll delay={0.25}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                  {features[3].icon && React.createElement(features[3].icon, { className: "w-5 h-5 text-violet-600" })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[3].title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{features[3].desc}</p>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Small card: Multi-language */}
          <AnimateOnScroll delay={0.3}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
                  {features[4].icon && React.createElement(features[4].icon, { className: "w-5 h-5 text-rose-600" })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[4].title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{features[4].desc}</p>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Small card: Configurable AI */}
          <AnimateOnScroll delay={0.35}>
            <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">
                  {features[5].icon && React.createElement(features[5].icon, { className: "w-5 h-5 text-cyan-600" })}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{features[5].title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{features[5].desc}</p>
              </CardContent>
            </Card>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
