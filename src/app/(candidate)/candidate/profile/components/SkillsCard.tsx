'use client';

import React from 'react';
import { Plus, X, Award } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SkillsCardProps {
  skills: string[];
  newSkill: string;
  setNewSkill: (v: string) => void;
  addSkill: () => void;
  removeSkill: (skill: string) => void;
}

export default function SkillsCard({ skills, newSkill, setNewSkill, addSkill, removeSkill }: SkillsCardProps) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-sm card-hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-600" />
          {t.candidate.skills}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="pl-2.5 pr-1 py-1 text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
              {skill}
              <button onClick={() => removeSkill(skill)} className="ml-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t.candidate.addSkill}
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="h-9 max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={addSkill} className="h-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
