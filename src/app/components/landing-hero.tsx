// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AnimateOnScroll, AnimatedCounter, usePlatformStats } from './landing-shared';

export default function LandingHero({ scrollToSection }) {
  const { t } = useI18n();
  const router = useRouter();
  const { stats, loading: statsLoading } = usePlatformStats();

  return (
    <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <Badge className="mb-4 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
              <Sparkles className="w-3 h-3 me-1.5" />
              {t.common.poweredBy}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
              {t.landing.hero}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base"
                onClick={() => router.push('/auth/register')}
              >
                {t.landing.getStarted}
                <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12 text-base border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => scrollToSection('how-it-works')}
              >
                {t.landing.howItWorks}
              </Button>
            </div>

            {/* Trusted by */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-4">{t.landing.trustedBy}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-400">
                <span>Stripe</span>
                <span>Vercel</span>
                <span>Linear</span>
                <span>Notion</span>
                <span>Figma</span>
                <span>Shopify</span>
              </div>
            </div>
          </div>

          {/* Right: Kanban Pipeline Mockup */}
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="ms-2 text-xs text-slate-500 font-medium">{t.landing.heroDashboardTitle}</span>
              </div>

              {/* Kanban board */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Column: Screening */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupScreening}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">12</span>
                    </div>
                    {[
                      { name: 'Alex M.', role: 'Frontend Dev', score: '92%' },
                      { name: 'Priya S.', role: 'Backend Dev', score: '88%' },
                      { name: 'James K.', role: 'Full Stack', score: '85%' },
                    ].map((c, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.role}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: c.score }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{c.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column: Interview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupInterview}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">5</span>
                    </div>
                    {[
                      { name: 'Maria L.', role: 'Product Mgr', stage: 'Technical' },
                      { name: 'David R.', role: 'Data Eng', stage: 'Behavioral' },
                    ].map((c, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.role}</p>
                        <span className="inline-block mt-1.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">{c.stage}</span>
                      </div>
                    ))}
                  </div>

                  {/* Column: Offers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupOffers}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">3</span>
                    </div>
                    {[
                      { name: 'Sarah T.', role: 'Senior Dev', status: 'Accepted' },
                      { name: 'Tom W.', role: 'Designer', status: 'Pending' },
                    ].map((c, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.role}</p>
                        <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium ${c.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {statsLoading ? (
              <>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCandidatesLabel}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCompaniesLabel}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterJobsLabel}</p>
                </div>
              </>
            ) : stats ? (
              <>
                <div className="text-center">
                  <AnimatedCounter target={stats.candidates} suffix="+" />
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCandidatesLabel}</p>
                </div>
                <div className="text-center">
                  <AnimatedCounter target={stats.companies} suffix="+" />
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCompaniesLabel}</p>
                </div>
                <div className="text-center">
                  <AnimatedCounter target={stats.jobs} suffix="+" />
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterJobsLabel}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
