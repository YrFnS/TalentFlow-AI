'use client';

import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ProfileCompletenessCardProps {
  profileCompleteness: number;
  personalInfo: {
    name: string;
    phone: string;
    location: string;
    bio: string;
  };
  experiencesLength: number;
  educationsLength: number;
  skillsLength: number;
  certificationsLength: number;
  hasStoredResume: boolean;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
}

export default function ProfileCompletenessCard({
  profileCompleteness,
  personalInfo,
  experiencesLength,
  educationsLength,
  skillsLength,
  certificationsLength,
  hasStoredResume,
  isPublic,
  setIsPublic,
}: ProfileCompletenessCardProps) {
  const items = [
    {
      key: 'details',
      label: 'Add contact and location details',
      done: Boolean(personalInfo.name && personalInfo.phone && personalInfo.location),
    },
    {
      key: 'summary',
      label: 'Write a professional summary',
      done: Boolean(personalInfo.bio),
    },
    {
      key: 'skills',
      label: 'Add skills',
      done: skillsLength > 0,
    },
    {
      key: 'experience',
      label: 'Add work experience',
      done: experiencesLength > 0,
    },
    {
      key: 'education',
      label: 'Add education',
      done: educationsLength > 0,
    },
    {
      key: 'certifications',
      label: 'Add certifications',
      done: certificationsLength > 0,
    },
    {
      key: 'resume',
      label: 'Attach a resume when private storage is enabled',
      done: hasStoredResume,
    },
  ];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0 text-center">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-muted">
              <span className="text-2xl font-bold text-primary">
                {profileCompleteness}%
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Profile completeness
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-3 text-sm font-semibold">Profile checklist</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-start gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.done ? 'text-muted-foreground' : ''}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 rounded-xl border p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isPublic ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <p className="mt-2 text-xs font-medium">
              {isPublic ? 'Public profile' : 'Private profile'}
            </p>
            <p className="mt-1 max-w-36 text-[11px] text-muted-foreground">
              Controls whether your profile can appear in public candidate views.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
