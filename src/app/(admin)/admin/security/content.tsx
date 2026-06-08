// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { SecurityDashboardData } from './components/types.tsx';
import SecurityScoreCard from './components/SecurityScoreCard';
import RateLimitingCard from './components/RateLimitingCard';
import CsrfCspCards from './components/CsrfCspCards';
import AuthEventsCard from './components/AuthEventsCard';
import EncryptionFileVulnCards from './components/EncryptionFileVulnCards';
import CorsCard from './components/CorsCard';
import SecurityHeadersCard from './components/SecurityHeadersCard';
import QuickActionsCard from './components/QuickActionsCard';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-blue-600 text-white">
            {t.security.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.security.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t.security.refresh}
        </Button>
      </div>

      <SecurityScoreCard
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <RateLimitingCard
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <CsrfCspCards
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <AuthEventsCard
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <EncryptionFileVulnCards
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <CorsCard
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <SecurityHeadersCard
        data={data}
        loading={loading}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      <QuickActionsCard />
    </div>
  );
}
