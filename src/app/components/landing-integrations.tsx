// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { AnimateOnScroll } from './landing-shared';

export default function LandingIntegrations() {
  const { t } = useI18n();

  const integrations = ['Slack', 'LinkedIn', 'Google Calendar', 'Zapier', 'Jira', 'Notion', 'Microsoft Teams', 'Gmail'];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t.landing.integrationsTitle}
          </h2>
          <p className="text-slate-500 text-sm">
            {t.landing.integrationsSubtitle}
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            {integrations.map((name) => (
              <span key={name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                {name}
              </span>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
