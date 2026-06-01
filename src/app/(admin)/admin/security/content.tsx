// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  AlertTriangle,
  Lock,
  Users,
  UserCheck,
  Key,
  RefreshCw,
  LockKeyhole,
  CheckCircle2,
  XCircle,
  Info,
  FileUp,
  Bug,
  Globe,
  FileText,
  Fingerprint,
  Upload,
  ChevronDown,
  ChevronUp,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ScoreBreakdownItem {
  feature: string;
  points: number;
  maxPoints: number;
  status: 'pass' | 'warn' | 'fail';
}

interface LimiterInfo {
  name: string;
  totalKeys: number;
  totalRequests: number;
  maxRequests: number;
  windowMs: number;
  windowHuman: string;
  utilization: string;
  topKeys: Array<{ key: string; count: number }>;
}

interface RateLimitingData {
  enabled: boolean;
  keyStrategy: string;
  noSharedBuckets: boolean;
  limiters: LimiterInfo[];
}

interface CsrfData {
  enabled: boolean;
  cookieName: string;
  headerName: string;
  exemptPaths: string[];
}

interface CspData {
  nonceBased: boolean;
  rotationIntervalMs: number;
  rotationIntervalHuman: string;
  directives: Record<string, string>;
}

interface AuthEvent {
  id: string;
  action: string;
  ip: string;
  email: string;
  timestamp: string;
  details: string;
}

interface AuthStatsData {
  loginSuccess24h: number;
  loginFailures24h: number;
  loginFailures7d: number;
  socialLogins24h: number;
  registrations24h: number;
  accountLockouts24h: number;
  suspiciousActivity24h: number;
  failureRate: number;
  recentEvents: AuthEvent[];
}

interface EncryptionData {
  configured: boolean;
  warning?: string;
}

interface VulnData {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  lastAuditDate: string;
  info: string;
}

interface FileUploadData {
  maxFileSizeMB: number;
  maxFileSizeBytes: number;
  allowedResumeTypes: string[];
  allowedImageTypes: string[];
  uploadDirectory: string;
}

interface CorsData {
  allowedOrigins: string[];
  allowCredentials: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: string;
  environment: string;
}

interface HeaderItem {
  name: string;
  value: string;
}

interface HeadersData {
  applied: boolean;
  headers: HeaderItem[];
  nonceBasedCSP: {
    enabled: boolean;
    rotationInterval: string;
  };
}

interface SecurityDashboardData {
  securityScore: number;
  scoreBreakdown: ScoreBreakdownItem[];
  rateLimiting: RateLimitingData;
  securityConfig: {
    csrf: CsrfData;
    csp: CspData;
    passwordPolicy: Record<string, unknown>;
    session: Record<string, unknown>;
    bruteForce: Record<string, unknown>;
  };
  authStats: AuthStatsData;
  encryptionStatus: EncryptionData;
  vulnerabilities: VulnData;
  fileUploadConfig: FileUploadData;
  corsConfig: CorsData;
  headersConfig: HeadersData;
  timestamp: string;
}

// Circular Score Indicator
function CircularScore({ score }: { score: number }) {
  const { t } = useI18n();
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score > 70) return { stroke: '#14b8a6', text: 'text-blue-600', label: t.security.scoreExcellent };
    if (score > 40) return { stroke: '#f59e0b', text: 'text-amber-600', label: t.security.scoreGood };
    return { stroke: '#ef4444', text: 'text-red-600', label: t.security.scorePoor };
  };

  const colorInfo = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="currentColor"
            className="text-muted/30"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={colorInfo.stroke}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${colorInfo.text}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{t.security.score}</p>
        <Badge className={`mt-1 ${score > 70 ? 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0' : score > 40 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}`}>
          {colorInfo.label}
        </Badge>
      </div>
    </div>
  );
}

// Status badge helper
function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const { t } = useI18n();
  const config = {
    pass: { className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0', icon: <CheckCircle2 className="h-3 w-3 me-1" /> },
    warn: { className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0', icon: <AlertTriangle className="h-3 w-3 me-1" /> },
    fail: { className: 'bg-red-50 text-red-700 dark:bg-red-950 border-0', icon: <XCircle className="h-3 w-3 me-1" /> },
  };
  const c = config[status];
  return (
    <Badge className={`text-xs ${c.className}`}>
      {c.icon}
      {t.security[status]}
    </Badge>
  );
}

// Event action badge
function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { label: string; className: string }> = {
    LOGIN_SUCCESS: { label: 'Login ✓', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' },
    LOGIN_FAILURE: { label: 'Login ✗', className: 'bg-red-50 text-red-700 dark:bg-red-950 border-0' },
    ACCOUNT_LOCKED: { label: 'Locked', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0' },
    SUSPICIOUS_ACTIVITY: { label: 'Suspicious', className: 'bg-red-50 text-red-700 dark:bg-red-950 border-0' },
    PASSWORD_CHANGE: { label: 'Pw Change', className: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0' },
  };
  const c = config[action] || { label: action, className: 'bg-muted text-muted-foreground border-0' };
  return <Badge className={`text-xs ${c.className}`}>{c.label}</Badge>;
}

export default function SecurityDashboardContent() {
  const { t } = useI18n();
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rateLimiting: true,
    csrf: true,
    csp: true,
    authStats: true,
    encryption: true,
    fileUpload: true,
    vulnerabilities: true,
    cors: true,
    headers: true,
    scoreBreakdown: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security-dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const Skeleton = () => (
    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-blue-600 bg-clip-text text-transparent">
            {t.security.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.security.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t.security.refresh}
        </Button>
      </div>

      {/* ============================================
          1. Security Score Card + Score Breakdown
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Security Score Card */}
        <Card className="lg:col-span-1 border-0 shadow-md animate-fade-in-up">
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[280px]">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-40 w-40 bg-muted animate-pulse rounded-full" />
                <Skeleton />
              </div>
            ) : (
              <>
                <CircularScore score={data?.securityScore ?? 0} />
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date().toLocaleTimeString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Score Breakdown + Auth Stats Quick View */}
        <div className="lg:col-span-4 space-y-4">
          {/* Score Breakdown */}
          <Card className="border-0 shadow-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('scoreBreakdown')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold">{t.security.scoreBreakdown}</CardTitle>
                </div>
                {expandedSections.scoreBreakdown ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {expandedSections.scoreBreakdown && (
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(data?.scoreBreakdown ?? []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="text-sm font-medium">{item.feature}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20">
                            <Progress value={(item.points / item.maxPoints) * 100} className="h-2" />
                          </div>
                          <span className="text-sm font-bold text-muted-foreground w-14 text-end">
                            {item.points}/{item.maxPoints}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Auth Stats Quick View */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-slate-50 opacity-60" />
              <CardContent className="relative p-5">
                {loading ? <Skeleton /> : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                        <LogIn className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.security.loginSuccess}</span>
                    </div>
                    <p className="text-2xl font-bold">{data?.authStats.loginSuccess24h ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 opacity-60" />
              <CardContent className="relative p-5">
                {loading ? <Skeleton /> : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.security.loginFailures}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{data?.authStats.loginFailures24h ?? 0}</p>
                      <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs">
                        {data?.authStats.failureRate ?? 0}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 opacity-60" />
              <CardContent className="relative p-5">
                {loading ? <Skeleton /> : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <Lock className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.security.accountLockouts}</span>
                    </div>
                    <p className="text-2xl font-bold">{data?.authStats.accountLockouts24h ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 opacity-60" />
              <CardContent className="relative p-5">
                {loading ? <Skeleton /> : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                        <ShieldAlert className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.security.suspiciousActivity24h}</span>
                    </div>
                    <p className="text-2xl font-bold">{data?.authStats.suspiciousActivity24h ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ============================================
          2. Rate Limiting Status
          ============================================ */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('rateLimiting')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <Server className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{t.security.rateLimitingStatus}</CardTitle>
                <CardDescription className="text-xs">{t.security.keyStrategy}: {data?.rateLimiting.keyStrategy ?? '—'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs">
                {data?.rateLimiting.enabled ? t.security.enabled : t.security.disabled}
              </Badge>
              {expandedSections.rateLimiting ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.rateLimiting && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.rateLimiting.limiters ?? []).map((limiter) => (
                  <div key={limiter.name} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize">{limiter.name}</span>
                        <Badge variant="secondary" className="text-xs">{limiter.windowHuman}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{t.security.totalKeys}: <strong className="text-foreground">{limiter.totalKeys}</strong></span>
                        <span>{t.security.totalRequests}: <strong className="text-foreground">{limiter.totalRequests}</strong></span>
                        <span>{t.security.maxRequests}: <strong className="text-foreground">{limiter.maxRequests}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={parseFloat(limiter.utilization)} className="h-2 flex-1" />
                      <span className="text-xs font-bold text-muted-foreground w-12 text-end">{limiter.utilization}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ============================================
          3 & 4. CSRF Protection + CSP Configuration
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSRF Protection */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('csrf')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-semibold">{t.security.csrfProtection}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={data?.securityConfig.csrf.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs'}>
                  {data?.securityConfig.csrf.enabled ? t.security.enabled : t.security.disabled}
                </Badge>
                {expandedSections.csrf ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
          {expandedSections.csrf && (
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
                    <span className="text-sm text-muted-foreground">{t.security.csrfCookie}</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{data?.securityConfig.csrf.cookieName ?? '—'}</code>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t.security.csrfHeader}</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{data?.securityConfig.csrf.headerName ?? '—'}</code>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground block mb-2">{t.security.csrfExemptPaths}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(data?.securityConfig.csrf.exemptPaths ?? []).map((path) => (
                        <Badge key={path} variant="secondary" className="text-xs font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/30 border-0">
                          {path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* CSP Configuration */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('csp')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                  <LockKeyhole className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold">{t.security.cspConfiguration}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={data?.securityConfig.csp.nonceBased ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0 text-xs'}>
                  {data?.securityConfig.csp.nonceBased ? t.security.nonceBasedCSP : 'unsafe-inline'}
                </Badge>
                {expandedSections.csp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
          {expandedSections.csp && (
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
                    <span className="text-sm text-muted-foreground">{t.security.cspNonceBased}</span>
                    <Badge className={data?.securityConfig.csp.nonceBased ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}>
                      {data?.securityConfig.csp.nonceBased ? t.security.yes : t.security.no}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t.security.cspRotationInterval}</span>
                    <Badge variant="secondary" className="text-xs">{data?.securityConfig.csp.rotationIntervalHuman ?? '—'}</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground block mb-2">{t.security.cspDirectives}</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                      {Object.entries(data?.securityConfig.csp.directives ?? {}).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="font-mono text-blue-600 shrink-0">{key}:</span>
                          <span className="font-mono text-muted-foreground break-all">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* ============================================
          5. Authentication Stats - Recent Events
          ============================================ */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('authStats')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{t.security.authStats}</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{t.security.registration24h}: <strong className="text-foreground">{data?.authStats.registrations24h ?? 0}</strong></span>
              <span>{t.security.socialLogins}: <strong className="text-foreground">{data?.authStats.socialLogins24h ?? 0}</strong></span>
              {expandedSections.authStats ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.authStats && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (data?.authStats.recentEvents ?? []).length > 0 ? (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-start pb-2 font-medium">{t.security.action}</th>
                      <th className="text-start pb-2 font-medium">{t.security.email}</th>
                      <th className="text-start pb-2 font-medium">{t.security.ipAddress}</th>
                      <th className="text-start pb-2 font-medium">{t.security.timestamp}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.authStats.recentEvents ?? []).slice(0, 15).map((event) => (
                      <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pe-4">
                          <ActionBadge action={event.action} />
                        </td>
                        <td className="py-3 pe-4">
                          <span className="text-sm truncate max-w-[180px] block">{event.email}</span>
                        </td>
                        <td className="py-3 pe-4">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{event.ip}</code>
                        </td>
                        <td className="py-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">{t.security.noRecommendations}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ============================================
          6. Encryption + File Upload + Vulnerabilities
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Encryption Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('encryption')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
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

      {/* ============================================
          7. CORS Configuration
          ============================================ */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('cors')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{t.security.corsConfiguration}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{data?.corsConfig.environment ?? '—'}</Badge>
              {expandedSections.cors ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.cors && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground block mb-2">{t.security.corsAllowedOrigins}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(data?.corsConfig.allowedOrigins ?? []).length > 0 ? (
                        data!.corsConfig.allowedOrigins.map((origin) => (
                          <Badge key={origin} variant="secondary" className="text-xs font-mono bg-slate-50 text-blue-700 border-0">
                            {origin}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None configured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t.security.corsAllowCredentials}</span>
                    <Badge className={data?.corsConfig.allowCredentials ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}>
                      {data?.corsConfig.allowCredentials ? t.security.yes : t.security.no}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground block mb-2">{t.security.corsAllowedMethods}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(data?.corsConfig.allowedMethods ?? []).map((method) => (
                        <Badge key={method} variant="secondary" className="text-xs font-mono bg-emerald-50 text-emerald-700 border-0">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t.security.corsMaxAge}</span>
                    <Badge variant="secondary" className="text-xs">{data?.corsConfig.maxAge ?? '—'}s</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t.security.corsEnvironment}</span>
                    <Badge variant="secondary" className="text-xs">{data?.corsConfig.environment ?? '—'}</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ============================================
          8. Security Headers
          ============================================ */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('headers')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{t.security.securityHeaders}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={data?.headersConfig.applied ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs'}>
                {data?.headersConfig.applied ? t.security.enabled : t.security.disabled}
              </Badge>
              {expandedSections.headers ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.headers && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Nonce CSP Info */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-teal-100 dark:border-teal-900">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{t.security.nonceBasedCSP}</span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs">
                    {data?.headersConfig.nonceBasedCSP.enabled ? t.security.enabled : t.security.disabled}
                  </Badge>
                </div>

                {/* Headers Table */}
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-start pb-2 font-medium">{t.security.headerName}</th>
                        <th className="text-start pb-2 font-medium">{t.security.headerValue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.headersConfig.headers ?? []).map((header, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 pe-4">
                            <code className="text-xs font-mono text-blue-600">{header.name}</code>
                          </td>
                          <td className="py-2.5">
                            <code className="text-xs font-mono text-muted-foreground break-all">{header.value}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ============================================
          Quick Actions
          ============================================ */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{t.security.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"
              onClick={() => toast.success(t.security.actionCompleted, { description: t.security.lockSuspicious })}
            >
              <Lock className="h-5 w-5" />
              <span className="text-xs font-medium">{t.security.lockSuspicious}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 transition-all"
              onClick={() => toast.success(t.security.actionCompleted, { description: t.security.forcePasswordReset })}
            >
              <Key className="h-5 w-5" />
              <span className="text-xs font-medium">{t.security.forcePasswordReset}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 transition-all"
              onClick={() => toast.success(t.security.actionCompleted, { description: t.security.exportReport })}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">{t.security.exportReport}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 transition-all"
              onClick={() => toast.success(t.security.actionCompleted, { description: t.security.clearRateLimits })}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-xs font-medium">{t.security.clearRateLimits}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
