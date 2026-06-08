// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, Pencil, Trash2, DollarSign, MapPin, Users, Clock } from 'lucide-react';
import type { JobTemplate } from './constants';
import { departmentColors, jobTypeColors, getDepartmentLabel, getJobTypeLabel, formatDate, formatSalary } from './constants';

interface TemplateCardProps {
  template: JobTemplate;
  onUse: (template: JobTemplate) => void;
  onEdit: (template: JobTemplate) => void;
  onDelete: (template: JobTemplate) => void;
}

export default function TemplateCard({ template, onUse, onEdit, onDelete }: TemplateCardProps) {
  const { t } = useI18n();

  return (
    <Card className="group card-border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shrink-0">
            <span className="text-xs font-bold">{getInitials(template.title)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-sm font-semibold leading-tight truncate">
                    {template.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{template.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge variant="secondary" className={`text-[10px] ${departmentColors[template.department] || ''}`}>
                {getDepartmentLabel(template.department, t)}
              </Badge>
              <Badge variant="secondary" className={`text-[10px] ${jobTypeColors[template.jobType] || ''}`}>
                {getJobTypeLabel(template.jobType)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
          {template.description}
        </CardDescription>

        {(template.salaryMin || template.salaryMax) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-blue-500" />
              {formatSalary(template.salaryMin, template.salaryMax)}
            </span>
            {template.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-500" />
                {template.location}
              </span>
            )}
          </div>
        )}

        {template.remote && (
          <Badge variant="outline" className="text-[10px] border-slate-200 text-blue-700">
            {t.jobTemplates.remote}
          </Badge>
        )}

        {template.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-thin">
            {template.skills.slice(0, 4).map((skill, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0"
              >
                {skill}
              </Badge>
            ))}
            {template.skills.length > 4 && (
              <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-0">
                +{template.skills.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {t.jobTemplates.templateUsed} {template.usageCount} {t.jobTemplates.times}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(template.updatedAt)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs h-8"
            onClick={() => onUse(template)}
          >
            <Copy className="w-3 h-3 me-1" />
            {t.jobTemplates.useTemplate}
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 w-8 p-0"
                  onClick={() => onEdit(template)}
                  aria-label={t.jobTemplates.editTemplate}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.jobTemplates.editTemplate}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(template)}
                  aria-label={t.jobTemplates.deleteTemplate}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.jobTemplates.deleteTemplate}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
