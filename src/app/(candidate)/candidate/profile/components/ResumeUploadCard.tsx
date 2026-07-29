'use client';

import { FileLock2, FileText, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResumeUploadCardProps {
  hasStoredResume: boolean;
}

export default function ResumeUploadCard({
  hasStoredResume,
}: ResumeUploadCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Resume
          {hasStoredResume && (
            <Badge variant="secondary" className="ms-auto">
              Existing resume data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileLock2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Private resume upload is not enabled</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The previous browser upload and PDF-as-text parser were removed. Resume
              upload will return after private object storage, malware scanning,
              authenticated downloads, retention rules, and real document extraction
              are configured together.
            </p>
            {hasStoredResume && (
              <p className="mt-3 flex items-start gap-2 text-sm text-amber-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Existing resume metadata remains associated with your account, but it
                is not exposed through this page.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
