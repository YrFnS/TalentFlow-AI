// @ts-nocheck
'use client';

import React from 'react';
import { AlertCircle, Sparkles, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { JobForm } from './types';
import { jobTypeOptions } from './types';

interface JobDetailsStepProps {
  form: JobForm;
  updateField: (field: string, value: unknown) => void;
  aiError: string | null;
  onOpenAiDialog: () => void;
  t: Record<string, any>;
}

export default function JobDetailsStep({ form, updateField, aiError, onOpenAiDialog, t }: JobDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Job Details</h2>
          <p className="text-sm text-muted-foreground">Basic information about the position</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAiDialog}
            className="border-slate-300 text-blue-600 hover:bg-slate-50"
          >
            <Sparkles className="w-4 h-4 me-2" />
            AI Generate
          </Button>
          {aiError && (
            <div className="flex items-start gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 max-w-xs">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-red-700">{aiError}</p>
                {aiError.includes('No active AI provider') && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-600" asChild>
                    <Link href="/company/ai-settings">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure AI
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">{t.jobs.jobTitle} *</Label>
          <Input
            id="title"
            placeholder="e.g., Senior Frontend Engineer"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t.jobs.jobDescription} *</Label>
          <Textarea
            id="description"
            placeholder="Describe the role, team, and what makes this opportunity exciting..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={8}
            className="resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>{t.jobs.jobType}</Label>
            <Select value={form.jobType} onValueChange={(v) => updateField('jobType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jobTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="openings">{t.jobs.openings}</Label>
            <Input
              id="openings"
              type="number"
              min="1"
              value={form.openings}
              onChange={(e) => updateField('openings', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location">{t.jobs.location}</Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">{t.jobs.deadline}</Label>
            <Input
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.isRemote}
            onCheckedChange={(v) => updateField('isRemote', v)}
          />
          <Label>Remote-friendly position</Label>
        </div>
      </div>
    </div>
  );
}
