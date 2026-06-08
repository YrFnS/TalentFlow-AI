// @ts-nocheck
'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface SkillTaxonomy {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
}

interface SkillBadgeSelectorProps {
  taxonomy: SkillTaxonomy[];
  formSkillIds: string[];
  toggleSkill: (skillId: string) => void;
  getCategoryLabel: (category: string) => string;
  sa: Record<string, string>;
}

export default function SkillBadgeSelector({
  taxonomy,
  formSkillIds,
  toggleSkill,
  getCategoryLabel,
  sa,
}: SkillBadgeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{sa.selectSkills} *</Label>
      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
        {['TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'TOOL', 'CERTIFICATION'].map((cat) => {
          const catSkills = taxonomy.filter((s) => s.category === cat);
          if (catSkills.length === 0) return null;
          return (
            <div key={cat} className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                {getCategoryLabel(cat)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {catSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={formSkillIds.includes(skill.id) ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs transition-all ${
                      formSkillIds.includes(skill.id)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:border-slate-400'
                    }`}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.name}
                    {formSkillIds.includes(skill.id) && (
                      <X className="h-2.5 w-2.5 ms-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {formSkillIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {formSkillIds.length} skill(s) selected
        </p>
      )}
    </div>
  );
}
