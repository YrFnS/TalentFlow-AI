// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Key, Upload, Bug, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function EncryptionFileVulnCards({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Encryption Status */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('encryption')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <Key className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">{t.security.encryptionStatus}</CardTitle>
            </div>
            {expandedSections.encryption ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.encryption && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.encryptionConfigured}</span>
                  <Badge className={data?.encryptionStatus.configured ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}>
                    {data?.encryptionStatus.configured ? t.security.yes : t.security.no}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.encryptionAlgorithm}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">AES-256-GCM</code>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.encryptionKeyLength}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">256 bits</code>
                </div>
                {data?.encryptionStatus.warning && (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700 text-sm">{t.security.encryptionWarning}</AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-500 text-xs">
                      {data.encryptionStatus.warning}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* File Upload Security */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('fileUpload')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">{t.security.fileUploadSecurity}</CardTitle>
            </div>
            {expandedSections.fileUpload ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.fileUpload && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.maxFileSize}</span>
                  <Badge variant="secondary" className="text-xs">{data?.fileUploadConfig.maxFileSizeMB ?? 0} MB</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.allowedResumeTypes}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.fileUploadConfig.allowedResumeTypes ?? []).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs font-mono bg-slate-50 text-blue-700 border-0">
                        {type.replace('application/', '').replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx').replace('msword', 'doc')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.allowedImageTypes}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.fileUploadConfig.allowedImageTypes ?? []).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs font-mono bg-emerald-50 text-emerald-700 border-0">
                        {type.replace('image/', '')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.uploadDirectory}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{data?.fileUploadConfig.uploadDirectory ?? '—'}</code>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dependency Vulnerabilities */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('vulnerabilities')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <Bug className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold">{t.security.depVulnerabilities}</CardTitle>
            </div>
            {expandedSections.vulnerabilities ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.vulnerabilities && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: t.security.vulnCritical, count: data?.vulnerabilities.critical ?? 0, color: 'bg-red-50 text-red-700 dark:bg-red-950 border-0' },
                  { label: t.security.vulnHigh, count: data?.vulnerabilities.high ?? 0, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0' },
                  { label: t.security.vulnModerate, count: data?.vulnerabilities.moderate ?? 0, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-0' },
                  { label: t.security.vulnLow, count: data?.vulnerabilities.low ?? 0, color: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <Badge className={`text-sm font-bold ${item.color}`}>{item.count}</Badge>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic mt-2">{data?.vulnerabilities.info ?? ''}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
