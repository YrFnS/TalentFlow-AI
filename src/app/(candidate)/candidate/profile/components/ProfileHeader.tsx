'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';

export default function ProfileHeader() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.candidate.myProfile}</h1>
        <p className="text-muted-foreground mt-1">{t.resume.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2" onClick={() => {}}>
          <Sparkles className="h-4 w-4 text-blue-600" />
          {t.candidate.aiAnalyzeResume}
        </Button>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}
