'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type TranslationKeys } from '@/lib/i18n';

type Locale = 'en' | 'ar';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  dir: 'ltr' | 'rtl';
}

/**
 * Only persist `locale` — `t` and `dir` are always derived from it.
 * This prevents stale translation objects from localStorage when new keys
 * are added to translations.ts (which caused "Cannot read properties of
 * undefined (reading 'split')" errors).
 */
export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'en',
      t: translations.en,
      dir: 'ltr' as const,
      setLocale: (locale: Locale) => {
        set({
          locale,
          t: translations[locale],
          dir: locale === 'ar' ? 'rtl' : 'ltr',
        });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        }
      },
    }),
    {
      name: 'talentflow-i18n',
      // Only persist locale — translations are always derived fresh
      partialize: (state) => ({ locale: state.locale }),
      // Re-derive t and dir when rehydrating from localStorage
      merge: (persistedState, currentState) => {
        const ps = persistedState as Partial<I18nState>;
        const locale = ps.locale || 'en';
        return {
          ...currentState,
          locale,
          t: translations[locale],
          dir: locale === 'ar' ? 'rtl' : 'ltr',
        };
      },
    }
  )
);
