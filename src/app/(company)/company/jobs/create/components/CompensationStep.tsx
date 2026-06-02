// @ts-nocheck
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobForm } from './types';
import { currencyOptions } from './types';

interface CompensationStepProps {
  form: JobForm;
  updateField: (field: string, value: unknown) => void;
  t: Record<string, any>;
}

export default function CompensationStep({ form, updateField, t }: CompensationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Compensation</h2>
        <p className="text-sm text-muted-foreground">Set the salary range and currency</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="salaryMin">Minimum Salary</Label>
          <Input
            id="salaryMin"
            type="number"
            placeholder="80000"
            value={form.salaryMin}
            onChange={(e) => updateField('salaryMin', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="salaryMax">Maximum Salary</Label>
          <Input
            id="salaryMax"
            type="number"
            placeholder="120000"
            value={form.salaryMax}
            onChange={(e) => updateField('salaryMax', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Currency</Label>
          <Select value={form.salaryCurrency} onValueChange={(v) => updateField('salaryCurrency', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.salaryMin && form.salaryMax && (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/30">
          <p className="text-sm font-medium text-blue-700">
            Salary Range: ${parseInt(form.salaryMin).toLocaleString()} - ${parseInt(form.salaryMax).toLocaleString()} {form.salaryCurrency}
          </p>
        </div>
      )}
    </div>
  );
}
