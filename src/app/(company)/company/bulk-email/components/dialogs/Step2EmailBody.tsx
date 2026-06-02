// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Variable } from 'lucide-react';

interface Variable { key: string; labelKey: string; sample: string }

interface Step2Props {
  formBody: string; setFormBody: (v: string) => void;
  VARIABLES: Variable[]; insertVariable: (key: string) => void;
  replaceVariables: (text: string) => string;
  t: { bulkEmail: Record<string, string> };
}

export default function Step2({ formBody, setFormBody, VARIABLES, insertVariable, replaceVariables, t }: Step2Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.bulkEmail.emailBody}</label>
        <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} className="min-h-[200px] font-mono text-sm" placeholder="Write your email content..." />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-blue-600" />
          <label className="text-sm font-medium">{t.bulkEmail.insertVariable}</label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(v => (
            <Button key={v.key} variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-slate-200 hover:bg-slate-50 dark:hover:bg-teal-950"
              onClick={() => insertVariable(v.key)}>
              <span className="font-mono text-blue-600">{`{{${v.key}}}`}</span>
              <span className="text-muted-foreground">— {t.bulkEmail[v.labelKey]}</span>
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.bulkEmail.preview}</label>
        <div className="rounded-lg border border-border/50 p-3 bg-muted/30 text-sm whitespace-pre-line max-h-48 overflow-y-auto scrollbar-thin">
          {replaceVariables(formBody || '(empty)')}
        </div>
      </div>
    </div>
  );
}
