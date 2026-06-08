// @ts-nocheck
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { AnimateOnScroll } from './landing-shared';

export default function LandingPricing() {
  const { t } = useI18n();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);

  const pricingPlans = [
    {
      name: t.landing.starter,
      monthlyPrice: t.landing.pricingStarterMonthly,
      yearlyPrice: t.landing.pricingStarterMonthly,
      monthlySuffix: '',
      yearlySuffix: '',
      desc: t.landing.starterDesc,
      features: [t.landing.pricingStarterFeature1, t.landing.pricingStarterFeature2, t.landing.pricingStarterFeature3, t.landing.pricingStarterFeature4, t.landing.pricingStarterFeature5],
      popular: false,
    },
    {
      name: t.landing.growth,
      monthlyPrice: t.landing.pricingGrowthMonthly,
      yearlyPrice: t.landing.pricingGrowthYearly,
      monthlySuffix: t.landing.pricingPerMonth,
      yearlySuffix: t.landing.pricingPerYear,
      desc: t.landing.growthDesc,
      features: [t.landing.pricingGrowthFeature1, t.landing.pricingGrowthFeature2, t.landing.pricingGrowthFeature3, t.landing.pricingGrowthFeature4, t.landing.pricingGrowthFeature5, t.landing.pricingGrowthFeature6, t.landing.pricingGrowthFeature7],
      popular: true,
    },
    {
      name: t.landing.enterprise,
      monthlyPrice: t.landing.pricingEnterpriseMonthly,
      yearlyPrice: t.landing.pricingEnterpriseMonthly,
      monthlySuffix: '',
      yearlySuffix: '',
      desc: t.landing.enterpriseDesc,
      features: [t.landing.pricingEnterpriseFeature1, t.landing.pricingEnterpriseFeature2, t.landing.pricingEnterpriseFeature3, t.landing.pricingEnterpriseFeature4, t.landing.pricingEnterpriseFeature5, t.landing.pricingEnterpriseFeature6, t.landing.pricingEnterpriseFeature7, t.landing.pricingEnterpriseFeature8],
      popular: false,
    },
  ];

  const comparisonFeatures = [
    { name: t.landing.pricingFeatureAiScreening, starter: true, growth: true, enterprise: true },
    { name: t.landing.pricingFeaturePipeline, starter: t.landing.pricingFeatureBasic, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureInterviews, starter: false, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureAnalytics, starter: false, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureTeamMembers, starter: '1', growth: '10', enterprise: t.landing.enterprise },
    { name: t.landing.pricingFeatureApi, starter: false, growth: false, enterprise: true },
    { name: t.landing.pricingFeatureSso, starter: false, growth: false, enterprise: true },
  ];

  function renderFeatureCell(val) {
    if (typeof val === 'boolean') {
      return val
        ? <Check className="w-4 h-4 text-blue-600 mx-auto" />
        : <span className="text-slate-300">—</span>;
    }
    return <span className="text-xs font-medium text-slate-600">{val}</span>;
  }

  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t.landing.pricing}
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Transparent pricing. No hidden fees. Scale as you grow.
          </p>
        </AnimateOnScroll>

        {/* Monthly/Yearly Toggle */}
        <AnimateOnScroll className="flex items-center justify-center gap-3 mb-12" delay={0.2}>
          <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
            {t.landing.pricingMonthly}
          </span>
          <button
            onClick={() => { setIsYearly(!isYearly); setPricingLoading(true); setTimeout(() => setPricingLoading(false), 600); }}
            className="relative w-14 h-7 rounded-full bg-slate-200 border border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label={isYearly ? t.landing.pricingMonthly : t.landing.pricingYearly}
            role="switch"
            aria-checked={isYearly}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-blue-600 shadow-sm transition-all duration-300 ${isYearly ? 'start-7' : 'start-0.5'}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
            {t.landing.pricingYearly}
          </span>
          {isYearly && (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
              {t.landing.pricingSave}
            </Badge>
          )}
        </AnimateOnScroll>

        <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={pricingLoading ? 'skeleton-shimmer' : ''}>
              <Card className={`h-full relative ${plan.popular ? 'border-2 border-blue-500 shadow-md' : 'border border-slate-200'} ${pricingLoading ? 'skeleton-shimmer' : ''}`}>
                <CardContent className="p-6">
                  <div className="text-center pb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-slate-900">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                      <span className="text-sm text-slate-500">
                        {isYearly ? plan.yearlySuffix : plan.monthlySuffix}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 pt-4 border-t border-slate-200">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => router.push('/auth/register')}
                  >
                    {t.landing.getStarted}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </AnimateOnScroll>

        {/* Pricing Comparison Table */}
        <AnimateOnScroll className="mt-12 max-w-3xl mx-auto" delay={0.3}>
          <Card className="border border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-start p-4 font-medium text-slate-500">{t.landing.pricingFeatureColumn}</th>
                      <th className="p-4 text-center font-medium text-slate-700">{t.landing.starter}</th>
                      <th className="p-4 text-center font-medium text-blue-600">{t.landing.growth}</th>
                      <th className="p-4 text-center font-medium text-slate-700">{t.landing.enterprise}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600">{feature.name}</td>
                        <td className="p-4 text-center">{renderFeatureCell(feature.starter)}</td>
                        <td className="p-4 text-center">{renderFeatureCell(feature.growth)}</td>
                        <td className="p-4 text-center">{renderFeatureCell(feature.enterprise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
