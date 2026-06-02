// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Plus } from 'lucide-react';
import type { ReferenceCheckStatus, ReferenceCheckItem } from './components/types';
import { mockReferenceChecks, mockApplications } from './components/types';
import StatsCards from './components/StatsCards';
import ReferenceChecksTable from './components/ReferenceChecksTable';
import ReferenceDetailDialog from './components/ReferenceDetailDialog';
import RequestReferenceDialog from './components/RequestReferenceDialog';
import { useReferenceForm } from './components/useReferenceForm';

export default function ReferenceChecksContent() {
  const { t } = useI18n();
  const rt = t.referenceChecks as Record<string, string>;

  const [filterStatus, setFilterStatus] = useState<ReferenceCheckStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<ReferenceCheckItem | null>(null);
  const [referenceChecks, setReferenceChecks] = useState<ReferenceCheckItem[]>(mockReferenceChecks);

  const closeDetail = () => setDetailOpen(false);
  const closeCreate = () => setCreateOpen(false);

  const form = useReferenceForm(referenceChecks, setReferenceChecks, rt, closeDetail, closeCreate);

  const filteredChecks = useMemo(() => {
    return referenceChecks.filter((rc) => {
      if (filterStatus !== 'all' && rc.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return rc.candidateName.toLowerCase().includes(q) || rc.referenceName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterStatus, searchQuery, referenceChecks]);

  const stats = useMemo(() => {
    const completed = referenceChecks.filter((r) => r.status === 'Completed');
    const ratingsSum = completed.reduce((sum, r) => sum + (r.rating || 0), 0);
    return {
      total: referenceChecks.length,
      pending: referenceChecks.filter((r) => r.status === 'Pending').length,
      completed: completed.length,
      avgRating: completed.length > 0 ? (ratingsSum / completed.length).toFixed(1) : '0',
    };
  }, [referenceChecks]);

  const openDetail = (rc: ReferenceCheckItem) => {
    setSelectedCheck(rc);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{rt.title}</h1>
            <p className="text-sm text-muted-foreground">{rt.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={() => { form.resetForm(); setCreateOpen(true); }}
        >
          <Plus className="h-4 w-4 me-2" />
          {rt.requestReference}
        </Button>
      </div>

      {/* Stats Row */}
      <StatsCards stats={stats} t={rt} />

      {/* Table with Filters */}
      <ReferenceChecksTable
        filteredChecks={filteredChecks}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        rt={rt}
        commonT={t.common}
        onOpenDetail={openDetail}
        onSendReminder={form.handleSendReminder}
      />

      {/* Reference Details Dialog */}
      <ReferenceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        selectedCheck={selectedCheck}
        rt={rt}
        commonT={t.common}
        onResendRequest={form.handleResendRequest}
        onMarkExpired={form.handleMarkExpired}
      />

      {/* Request Reference Dialog */}
      <RequestReferenceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        formApplicationId={form.formApplicationId}
        setFormApplicationId={form.setFormApplicationId}
        formRefName={form.formRefName}
        setFormRefName={form.setFormRefName}
        formRefEmail={form.formRefEmail}
        setFormRefEmail={form.setFormRefEmail}
        formRefPhone={form.formRefPhone}
        setFormRefPhone={form.setFormRefPhone}
        formRefTitle={form.formRefTitle}
        setFormRefTitle={form.setFormRefTitle}
        formRefCompany={form.formRefCompany}
        setFormRefCompany={form.setFormRefCompany}
        formRelationship={form.formRelationship}
        setFormRelationship={form.setFormRelationship}
        formQuestions={form.formQuestions}
        setFormQuestions={form.setFormQuestions}
        formExpiryDate={form.formExpiryDate}
        setFormExpiryDate={form.setFormExpiryDate}
        selectedApplication={form.selectedApplication}
        mockApplications={mockApplications}
        rt={rt}
        commonT={t.common}
        onAddQuestion={form.addQuestion}
        onUpdateQuestion={form.updateQuestion}
        onRemoveQuestion={form.removeQuestion}
        onSendRequest={form.handleSendRequest}
      />
    </div>
  );
}
