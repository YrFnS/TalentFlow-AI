// @ts-nocheck
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';
import type { JobForm, ScreeningQuestion } from './types';
import { jobTypeOptions } from './types';

interface PreviewStepProps {
  form: JobForm;
  screeningQuestions: ScreeningQuestion[];
  t: Record<string, any>;
}

export default function PreviewStep({ form, screeningQuestions, t }: PreviewStepProps) {
  const validQuestions = screeningQuestions.filter((q) => q.question.trim());
  const questionTypeLabel = (type: string, screening: Record<string, string>) => {
    const map: Record<string, string> = {
      YES_NO: screening.typeYesNo,
      MULTIPLE_CHOICE: screening.typeMultipleChoice,
      TEXT: screening.typeText,
      NUMBER: screening.typeNumber,
      DATE: screening.typeDate,
    };
    return map[type] || type;
  };
  const screening = t.screening;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preview</h2>
        <p className="text-sm text-muted-foreground">Review your job posting before publishing</p>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold">{form.title || 'Job Title'}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className="bg-teal-100 text-blue-700">
              {jobTypeOptions.find((o) => o.value === form.jobType)?.label}
            </Badge>
            {form.isRemote && <Badge variant="outline">Remote</Badge>}
            {form.location && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" />
                {form.location}
              </Badge>
            )}
          </div>
        </div>

        {form.salaryMin && form.salaryMax && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Salary</h4>
            <p className="text-sm text-blue-600">
              ${parseInt(form.salaryMin).toLocaleString()} - ${parseInt(form.salaryMax).toLocaleString()} {form.salaryCurrency}
            </p>
          </div>
        )}

        {form.description && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{t.jobs.jobDescription}</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{form.description}</div>
          </div>
        )}

        {form.requirements.filter((r) => r.trim()).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{t.jobs.requirements}</h4>
            <ul className="list-disc list-inside space-y-1">
              {form.requirements.filter((r) => r.trim()).map((req, i) => (
                <li key={i} className="text-sm text-muted-foreground">{req}</li>
              ))}
            </ul>
          </div>
        )}

        {form.responsibilities.filter((r) => r.trim()).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{t.jobs.responsibilities}</h4>
            <ul className="list-disc list-inside space-y-1">
              {form.responsibilities.filter((r) => r.trim()).map((resp, i) => (
                <li key={i} className="text-sm text-muted-foreground">{resp}</li>
              ))}
            </ul>
          </div>
        )}

        {form.benefits.filter((b) => b.trim()).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{t.jobs.benefits}</h4>
            <ul className="list-disc list-inside space-y-1">
              {form.benefits.filter((b) => b.trim()).map((ben, i) => (
                <li key={i} className="text-sm text-muted-foreground">{ben}</li>
              ))}
            </ul>
          </div>
        )}

        {form.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{t.jobs.skills}</h4>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(form.experienceMin || form.experienceMax) && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t.jobs.experience}</h4>
            <p className="text-sm text-muted-foreground">
              {form.experienceMin || '0'} - {form.experienceMax || '∞'} years
            </p>
          </div>
        )}

        {validQuestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">{screening.title}</h4>
            <div className="space-y-2">
              {validQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <div className="flex-1">
                    <span className="text-muted-foreground">{q.question}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {questionTypeLabel(q.questionType, screening)}
                      </Badge>
                      {q.isRequired && (
                        <Badge className="text-[10px] h-5 bg-slate-50 text-blue-700 border-0">
                          {screening.required}
                        </Badge>
                      )}
                      {q.isKnockout && (
                        <Badge className="text-[10px] h-5 bg-amber-50 text-amber-700 border-0 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {screening.knockout}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span>Openings: {form.openings}</span>
          {form.deadline && <span>Deadline: {form.deadline}</span>}
          {validQuestions.length > 0 && (
            <span>{validQuestions.length} screening questions</span>
          )}
        </div>
      </div>
    </div>
  );
}
