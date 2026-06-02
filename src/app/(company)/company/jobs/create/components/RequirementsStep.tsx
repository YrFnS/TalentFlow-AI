// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { JobForm } from './types';

interface RequirementsStepProps {
  form: JobForm;
  updateField: (field: string, value: unknown) => void;
  addListItem: (field: 'requirements' | 'responsibilities' | 'benefits') => void;
  removeListItem: (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => void;
  updateListItem: (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => void;
  t: Record<string, any>;
}

export default function RequirementsStep({
  form, updateField, addListItem, removeListItem, updateListItem, t,
}: RequirementsStepProps) {
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      updateField('skills', [...form.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Requirements & Skills</h2>
        <p className="text-sm text-muted-foreground">Define what you&apos;re looking for in a candidate</p>
      </div>

      {/* Requirements */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>{t.jobs.requirements}</Label>
          <Button variant="outline" size="sm" onClick={() => addListItem('requirements')} className="h-7 text-xs">
            + Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <Input
                placeholder="e.g., 5+ years of experience..."
                value={req}
                onChange={(e) => updateListItem('requirements', i, e.target.value)}
                className="flex-1"
              />
              {form.requirements.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('requirements', i)}>
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Responsibilities */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>{t.jobs.responsibilities}</Label>
          <Button variant="outline" size="sm" onClick={() => addListItem('responsibilities')} className="h-7 text-xs">
            + Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.responsibilities.map((resp, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 text-xs flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <Input
                placeholder="e.g., Lead the development of..."
                value={resp}
                onChange={(e) => updateListItem('responsibilities', i, e.target.value)}
                className="flex-1"
              />
              {form.responsibilities.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('responsibilities', i)}>
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>{t.jobs.benefits}</Label>
          <Button variant="outline" size="sm" onClick={() => addListItem('benefits')} className="h-7 text-xs">
            + Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.benefits.map((ben, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <Input
                placeholder="e.g., Competitive salary..."
                value={ben}
                onChange={(e) => updateListItem('benefits', i, e.target.value)}
                className="flex-1"
              />
              {form.benefits.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('benefits', i)}>
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="grid gap-2">
        <Label>{t.jobs.skills}</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Type a skill and press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Button variant="outline" onClick={addSkill} className="flex-shrink-0">
            Add
          </Button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-2.5 py-1 text-xs gap-1">
                {skill}
                <button onClick={() => updateField('skills', form.skills.filter((s) => s !== skill))} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="expMin">Min Experience (years)</Label>
          <Input
            id="expMin"
            type="number"
            min="0"
            placeholder="0"
            value={form.experienceMin}
            onChange={(e) => updateField('experienceMin', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="expMax">Max Experience (years)</Label>
          <Input
            id="expMax"
            type="number"
            min="0"
            placeholder="10"
            value={form.experienceMax}
            onChange={(e) => updateField('experienceMax', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
