// @ts-nocheck
'use client'

import { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Mail, Check } from 'lucide-react';

export default function LandingFooter() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                {t.common.appName}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">{t.common.appDescription}</p>
            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">{t.landing.newsletterTitle}</p>
              <p className="text-xs text-slate-500 mb-3">{t.landing.newsletterSubtitle}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={t.landing.newsletterPlaceholder}
                    className="h-10 text-sm ps-9 pe-3 rounded-lg border-slate-300 focus:border-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email.trim()) setEmailSubmitted(true);
                    }}
                  />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
                  onClick={() => { if (email.trim()) setEmailSubmitted(true); }}
                >
                  {emailSubmitted ? <Check className="w-4 h-4" /> : t.landing.newsletterSubscribe}
                </Button>
              </div>
              {emailSubmitted && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Subscribed successfully!
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">{t.landing.features}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{t.landing.feature1Title}</li>
              <li>{t.landing.feature2Title}</li>
              <li>{t.landing.feature3Title}</li>
              <li>{t.landing.feature4Title}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">{t.common.settings}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{t.footer.about}</li>
              <li>{t.footer.help}</li>
              <li>{t.footer.contact}</li>
              <li>{t.footer.privacy}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">{t.common.language}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{t.footer.terms}</li>
              <li>{t.footer.rights}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {t.common.appName}. {t.footer.rights}.</p>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Powered by TalentFlow AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
