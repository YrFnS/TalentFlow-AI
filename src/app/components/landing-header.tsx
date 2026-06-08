// @ts-nocheck
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import {
  Sparkles,
  Languages,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export default function LandingHeader({ scrollToSection }) {
  const { t, locale, setLocale, dir } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              {t.common.appName}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.features}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.howItWorks}</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.pricing}</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.faqLabel}</button>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              title={t.common.language}
              aria-label={t.common.language}
            >
              <Languages className="w-4 h-4" />
            </Button>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={t.common.theme}
                aria-label={t.common.theme}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push('/auth/login')} className="text-slate-600 hover:text-slate-900">
              {t.auth.signIn}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/auth/register')}>
              {t.landing.getStarted}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? t.landing.ariaCloseMenu : t.landing.ariaOpenMenu}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-3 animate-slide-down">
            <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.features}</button>
            <button onClick={() => { scrollToSection('how-it-works'); setMobileMenuOpen(false); }} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.howItWorks}</button>
            <button onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.pricing}</button>
            <button onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.faqLabel}</button>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
                <Languages className="w-4 h-4 me-1" /> {locale === 'en' ? 'العربية' : 'English'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push('/auth/login')}>{t.auth.signIn}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/auth/register')}>{t.landing.getStarted}</Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
