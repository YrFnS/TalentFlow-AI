// @ts-nocheck
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { ReferenceCheckStatus, ReferenceCheckItem, MockApplication } from './types';
import { mockApplications, defaultQuestions } from './types';

export function useReferenceForm(
  referenceChecks: ReferenceCheckItem[],
  setReferenceChecks: React.Dispatch<React.SetStateAction<ReferenceCheckItem[]>>,
  rt: Record<string, string>,
  closeDetail: () => void,
  closeCreate: () => void,
) {
  const [formApplicationId, setFormApplicationId] = useState('');
  const [formRefName, setFormRefName] = useState('');
  const [formRefEmail, setFormRefEmail] = useState('');
  const [formRefPhone, setFormRefPhone] = useState('');
  const [formRefTitle, setFormRefTitle] = useState('');
  const [formRefCompany, setFormRefCompany] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  const [formQuestions, setFormQuestions] = useState<string[]>([...defaultQuestions]);
  const [formExpiryDate, setFormExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const selectedApplication = useMemo(() => {
    return mockApplications.find((a) => a.id === formApplicationId);
  }, [formApplicationId]);

  const handleSendRequest = () => {
    if (!formApplicationId || !formRefName || !formRefEmail || !formRelationship) {
      toast.error(rt.validationError || 'Please fill in all required fields');
      return;
    }

    const app = mockApplications.find((a) => a.id === formApplicationId);
    if (!app) return;

    const newCheck: ReferenceCheckItem = {
      id: `rc-${Date.now()}`,
      applicationId: formApplicationId,
      candidateName: app.candidateName,
      candidateEmail: `${app.candidateName.toLowerCase().replace(' ', '.')}@email.com`,
      candidateCurrentTitle: '',
      referenceName: formRefName,
      referenceEmail: formRefEmail,
      referencePhone: formRefPhone,
      referenceTitle: formRefTitle,
      referenceCompany: formRefCompany,
      relationship: formRelationship,
      questions: formQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
      rating: null,
      status: 'Sent',
      sentDate: new Date().toISOString().split('T')[0],
      completedDate: '',
      expiresAt: formExpiryDate,
      token: `token-${Date.now()}`,
    };

    setReferenceChecks((prev) => [newCheck, ...prev]);
    toast.success(rt.requestSent || 'Reference check request sent');
    resetForm();
    closeCreate();
  };

  const handleResendRequest = (rc: ReferenceCheckItem) => {
    setReferenceChecks((prev) =>
      prev.map((r) =>
        r.id === rc.id
          ? { ...r, status: 'Sent' as ReferenceCheckStatus, sentDate: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(rt.resendRequest || 'Request resent');
    closeDetail();
  };

  const handleMarkExpired = (rc: ReferenceCheckItem) => {
    setReferenceChecks((prev) =>
      prev.map((r) =>
        r.id === rc.id ? { ...r, status: 'Expired' as ReferenceCheckStatus } : r
      )
    );
    toast.success(rt.markExpired || 'Marked as expired');
    closeDetail();
  };

  const handleSendReminder = (rc: ReferenceCheckItem) => {
    toast.success(rt.sendReminder || 'Reminder sent');
  };

  const addQuestion = () => {
    setFormQuestions((prev) => [...prev, '']);
  };

  const updateQuestion = (index: number, value: string) => {
    setFormQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const removeQuestion = (index: number) => {
    setFormQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormApplicationId('');
    setFormRefName('');
    setFormRefEmail('');
    setFormRefPhone('');
    setFormRefTitle('');
    setFormRefCompany('');
    setFormRelationship('');
    setFormQuestions([...defaultQuestions]);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setFormExpiryDate(d.toISOString().split('T')[0]);
  };

  return {
    formApplicationId, setFormApplicationId,
    formRefName, setFormRefName,
    formRefEmail, setFormRefEmail,
    formRefPhone, setFormRefPhone,
    formRefTitle, setFormRefTitle,
    formRefCompany, setFormRefCompany,
    formRelationship, setFormRelationship,
    formQuestions, setFormQuestions,
    formExpiryDate, setFormExpiryDate,
    selectedApplication,
    handleSendRequest,
    handleResendRequest,
    handleMarkExpired,
    handleSendReminder,
    addQuestion,
    updateQuestion,
    removeQuestion,
    resetForm,
  };
}
