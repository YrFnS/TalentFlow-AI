// @ts-nocheck
'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import type { TranslationKeys } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap } from 'lucide-react';
import { TemplateData, parseStepsJson, getTriggerLabel } from './types';
import { getActionLabel } from './types';

interface WorkflowTemplatesProps {
  templates: TemplateData[];
  applyTemplate: (template: TemplateData) => void;
}

export default function WorkflowTemplates({ templates, applyTemplate }: WorkflowTemplatesProps) {
  const { t } = useI18n() as { t: TranslationKeys };

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      {templates.map((template) => {
        const steps = parseStepsJson(template.steps);
        return (
          <Card
            key={template.id}
            className="border-border/50 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer transition-colors card-hover-lift"
            onClick={() => applyTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                      <Zap className="h-2.5 w-2.5 me-1" />
                      {getTriggerLabel(template.trigger, t)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {steps.length} {t.workflows.steps}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {steps.map((step, i) => (
                      <React.Fragment key={i}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
                          {step.action ? getActionLabel(step.action, t) : '?'}
                        </span>
                        {i < steps.length - 1 && (
                          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                  {t.workflows.useTemplate}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
