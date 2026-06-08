// @ts-nocheck
import { useI18n } from '@/store/i18n-store';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface ScoreBreakdownItem {
  feature: string;
  points: number;
  maxPoints: number;
  status: 'pass' | 'warn' | 'fail';
}

export interface LimiterInfo {
  name: string;
  totalKeys: number;
  totalRequests: number;
  maxRequests: number;
  windowMs: number;
  windowHuman: string;
  utilization: string;
  topKeys: Array<{ key: string; count: number }>;
}

export interface RateLimitingData {
  enabled: boolean;
  keyStrategy: string;
  noSharedBuckets: boolean;
  limiters: LimiterInfo[];
}

export interface CsrfData {
  enabled: boolean;
  cookieName: string;
  headerName: string;
  exemptPaths: string[];
}

export interface CspData {
  nonceBased: boolean;
  rotationIntervalMs: number;
  rotationIntervalHuman: string;
  directives: Record<string, string>;
}

export interface AuthEvent {
  id: string;
  action: string;
  ip: string;
  email: string;
  timestamp: string;
  details: string;
}

export interface AuthStatsData {
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

export interface EncryptionData {
  configured: boolean;
  warning?: string;
}

export interface VulnData {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  lastAuditDate: string;
  info: string;
}

export interface FileUploadData {
  maxFileSizeMB: number;
  maxFileSizeBytes: number;
  allowedResumeTypes: string[];
  allowedImageTypes: string[];
  uploadDirectory: string;
}

export interface CorsData {
  allowedOrigins: string[];
  allowCredentials: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: string;
  environment: string;
}

export interface HeaderItem {
  name: string;
  value: string;
}

export interface HeadersData {
  applied: boolean;
  headers: HeaderItem[];
  nonceBasedCSP: {
    enabled: boolean;
    rotationInterval: string;
  };
}

export interface SecurityDashboardData {
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

export function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
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

export function ActionBadge({ action }: { action: string }) {
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

export function CircularScore({ score }: { score: number }) {
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

export const Skeleton = () => (
  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
);
