'use client';

import { useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';

export function I18nDirectionHandler() {
  const { locale, dir } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
