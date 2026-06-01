'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ProfileCompletenessCardProps {
  profileCompleteness: number;
  personalInfo: { name: string; bio: string };
  experiencesLength: number;
  educationsLength: number;
  skillsLength: number;
  certificationsLength: number;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
}

export default function ProfileCompletenessCard({
  profileCompleteness,
  personalInfo,
  experiencesLength,
  educationsLength,
  skillsLength,
  certificationsLength,
  isPublic,
  setIsPublic,
}: ProfileCompletenessCardProps) {
  const { t } = useI18n();

  const items = [
    { key: 'photo', label: t.profileComplete.addPhoto, done: !!personalInfo.name },
    { key: 'experience', label: t.profileComplete.addExperience, done: experiencesLength > 0 },
    { key: 'education', label: t.profileComplete.addEducation, done: educationsLength > 0 },
    { key: 'certifications', label: t.profileComplete.addCertifications, done: certificationsLength > 0 },
    { key: 'skills', label: t.profileComplete.addSkills, done: skillsLength > 0 },
    { key: 'summary', label: t.profileComplete.writeSummary, done: !!personalInfo.bio },
  ];

  const motivationText =
    profileCompleteness === 100
      ? t.profileComplete.motivationComplete
      : profileCompleteness >= 75
        ? t.profileComplete.motivationAlmost
        : profileCompleteness >= 50
          ? t.profileComplete.motivationHalf
          : t.profileComplete.motivationStart;

  return (
    <Card className="border-0 shadow-sm card-">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Animated Progress Ring */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="url(#profileGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - profileCompleteness / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{profileCompleteness}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">{t.candidate.profileCompleteness}</p>
          </div>

          {/* Suggested Actions */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-3">{t.profileComplete.completeProfile}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">{motivationText}</p>
            </div>
          </div>

          {/* Public Profile Toggle */}
          <div className="shrink-0 sm:self-center">
            <div className="flex flex-col items-center gap-2">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <div className="text-center">
                <p className="text-xs font-medium">{t.candidate.publicProfile}</p>
                <p className="text-[10px] text-muted-foreground">{t.candidate.publicProfileDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
