// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, FileText, MessageSquare, Target, Mic, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import AIToolsGrid from './components/AiTools';
import AnalysisResultView from './components/AnalysisResultView';
import ToolResultDialog from './components/ToolResultDialog';
import ReactMarkdown from 'react-markdown';

export default function AIToolsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [resumeText, setResumeText] = useState('');
  const [jobDescForResume, setJobDescForResume] = useState('');
  const [coverJobDesc, setCoverJobDesc] = useState('');
  const [coverTargetRole, setCoverTargetRole] = useState('');
  const [gapCurrentSkills, setGapCurrentSkills] = useState('');
  const [gapTargetRole, setGapTargetRole] = useState('');
  const [interviewJobDesc, setInterviewJobDesc] = useState('');
  const [interviewTargetRole, setInterviewTargetRole] = useState('');
  const [interviewType, setInterviewType] = useState('technical');

  const userId = user?.id || '';

  const resetState = () => { setResult(null); setRawText(null); setError(null); setIsLoading(false); };
  const closeDialog = () => { setActiveDialog(null); resetState(); };
  const openTool = (id: string) => { resetState(); setActiveDialog(id); };

  const handleCopy = () => {
    const text = rawText || (result ? JSON.stringify(result, null, 2) : '');
    if (text) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleAnalyzeResume = useCallback(async () => {
    if (!resumeText.trim() || !jobDescForResume.trim()) return;
    setIsLoading(true); setError(null); setResult(null); setRawText(null); setActiveDialog('resume-analysis');
    try {
      const res = await fetch('/api/ai/analyze-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeText.trim(), jobDescription: jobDescForResume.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
      if (data.rawText) setRawText(data.rawText); else setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Network error'); }
    finally { setIsLoading(false); }
  }, [resumeText, jobDescForResume]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!coverJobDesc.trim()) return;
    setIsLoading(true); setError(null); setResult(null); setRawText(null);
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobDescription: coverJobDesc.trim(), candidateName: user?.name || undefined, candidateCurrentTitle: coverTargetRole.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Generation failed'); return; }
      setRawText(data.coverLetter);
    } catch (err) { setError(err instanceof Error ? err.message : 'Network error'); }
    finally { setIsLoading(false); }
  }, [userId, coverJobDesc, coverTargetRole, user?.name]);

  const handleSkillGapAnalysis = useCallback(async () => {
    if (!gapCurrentSkills.trim() || !gapTargetRole.trim()) return;
    setIsLoading(true); setError(null); setResult(null); setRawText(null);
    try {
      const res = await fetch('/api/ai/skill-gap-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentSkills: gapCurrentSkills.trim(), targetRole: gapTargetRole.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
      if (data.analysis?.rawText) setRawText(data.analysis.rawText); else setResult(data.analysis);
    } catch (err) { setError(err instanceof Error ? err.message : 'Network error'); }
    finally { setIsLoading(false); }
  }, [userId, gapCurrentSkills, gapTargetRole]);

  const handleInterviewPrep = useCallback(async () => {
    if (!interviewJobDesc.trim() && !interviewTargetRole.trim()) return;
    setIsLoading(true); setError(null); setResult(null); setRawText(null);
    try {
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobDescription: interviewJobDesc.trim() || `Interview for ${interviewTargetRole} position`, interviewType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Preparation failed'); return; }
      if (data.guide?.rawText) setRawText(data.guide.rawText); else setResult(data.guide);
    } catch (err) { setError(err instanceof Error ? err.message : 'Network error'); }
    finally { setIsLoading(false); }
  }, [userId, interviewJobDesc, interviewTargetRole, interviewType]);

  const renderError = (err: string) => (
    <div className="p-4 rounded-lg border border-red-200 bg-red-50">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700">Failed</p>
          <p className="text-xs text-red-600 mt-1">{err}</p>
          {err.includes('No active AI provider') && (
            <Button variant="outline" size="sm" className="mt-2 text-red-700 border-red-300 hover:bg-red-100" asChild>
              <Link href="/candidate/ai-settings"><Settings className="h-3.5 w-3.5 mr-1" />Configure AI</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t.candidate.aiTools}</h1>
            <p className="text-muted-foreground">AI-powered tools to boost your job search</p>
          </div>
        </div>
      </div>

      <AIToolsGrid t={t} onOpenTool={openTool} />

      {/* Resume Analysis Dialog */}
      <Dialog open={activeDialog === 'resume-analysis'} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />{t.candidate.resumeAnalysis}</DialogTitle></DialogHeader>
          {!isLoading && !result && !rawText && !error && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>{t.candidate.pasteResume}</Label><Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={8} placeholder="Paste your resume content here..." /></div>
              <div className="space-y-2"><Label>{t.candidate.pasteJobDescription} *</Label><Textarea value={jobDescForResume} onChange={(e) => setJobDescForResume(e.target.value)} rows={4} placeholder="Paste a job description to compare against..." /></div>
            </div>
          )}
          {isLoading && <div className="flex flex-col items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="mt-3 text-sm text-muted-foreground">{t.candidate.analyzing}</p></div>}
          {error && renderError(error)}
          {(result || rawText) && !isLoading && (
            <div className="space-y-4 overflow-y-auto max-h-[55vh] border-s-2 border-blue-200 pl-4">
              {result && !rawText && <AnalysisResultView data={result} />}
              {rawText && <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm"><ReactMarkdown>{rawText}</ReactMarkdown></div>}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            {(result || rawText || error) && !isLoading && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">{copied ? '✓ Copied!' : 'Copy'}</Button>
                <Button variant="outline" size="sm" onClick={closeDialog}>Close</Button>
              </>
            )}
            {!result && !rawText && !error && !isLoading && (
              <>
                <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleAnalyzeResume} disabled={!resumeText.trim() || !jobDescForResume.trim()}>
                  <Sparkles className="h-4 w-4" />{t.candidate.startAnalysis}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={activeDialog === 'cover-letter' && !rawText && !result} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-600" />{t.candidate.coverLetterGen}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>{t.candidate.targetRole}</Label><Input value={coverTargetRole} onChange={(e) => setCoverTargetRole(e.target.value)} placeholder={t.candidate.enterTargetRole} /></div>
            <div className="space-y-2"><Label>{t.candidate.pasteJobDescription}</Label><Textarea value={coverJobDesc} onChange={(e) => setCoverJobDesc(e.target.value)} rows={5} placeholder={t.candidate.pasteJobDescription} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleGenerateCoverLetter} disabled={!coverJobDesc.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{isLoading ? t.candidate.generating : t.candidate.generate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToolResultDialog open={activeDialog === 'cover-letter' && (!!rawText || !!result)} onOpenChange={(o) => { if (!o) closeDialog(); }} title="Generated Cover Letter" icon={<MessageSquare className="h-5 w-5 text-blue-600" />} result={result} rawText={rawText} error={error} copied={copied} onCopy={handleCopy} onClose={closeDialog} />

      {/* Skill Gap Dialog */}
      <Dialog open={activeDialog === 'skill-gap' && !result && !rawText} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-amber-600" />{t.candidate.skillGapAnalysis}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Current Skills</Label><Textarea value={gapCurrentSkills} onChange={(e) => setGapCurrentSkills(e.target.value)} rows={3} placeholder="e.g., React, TypeScript, Node.js, CSS, Git" /></div>
            <div className="space-y-2"><Label>{t.candidate.targetRole}</Label><Input value={gapTargetRole} onChange={(e) => setGapTargetRole(e.target.value)} placeholder="e.g., Senior Full Stack Developer" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleSkillGapAnalysis} disabled={!gapCurrentSkills.trim() || !gapTargetRole.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}{isLoading ? t.candidate.analyzing : t.candidate.analyzeGap}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToolResultDialog open={activeDialog === 'skill-gap' && (!!result || !!rawText)} onOpenChange={(o) => { if (!o) closeDialog(); }} title="Skill Gap Analysis" icon={<Target className="h-5 w-5 text-amber-600" />} result={result} rawText={rawText} error={error} copied={copied} onCopy={handleCopy} onClose={closeDialog} />

      {/* Interview Prep Dialog */}
      <Dialog open={activeDialog === 'interview-prep' && !result && !rawText} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-purple-600" />{t.candidate.interviewPrep}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>{t.candidate.targetRole}</Label><Input value={interviewTargetRole} onChange={(e) => setInterviewTargetRole(e.target.value)} placeholder={t.candidate.enterTargetRole} /></div>
            <div className="space-y-2"><Label>Job Description (optional)</Label><Textarea value={interviewJobDesc} onChange={(e) => setInterviewJobDesc(e.target.value)} rows={4} placeholder="Paste a job description for more targeted preparation..." /></div>
            <div className="space-y-2"><Label>{t.candidate.jobType}</Label><Select value={interviewType} onValueChange={setInterviewType}><SelectTrigger><SelectValue placeholder={t.candidate.selectJobType} /></SelectTrigger><SelectContent><SelectItem value="technical">Technical Interview</SelectItem><SelectItem value="behavioral">Behavioral Interview</SelectItem><SelectItem value="system-design">System Design</SelectItem><SelectItem value="case-study">Case Study</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleInterviewPrep} disabled={(!interviewJobDesc.trim() && !interviewTargetRole.trim()) || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{isLoading ? t.candidate.preparing : t.candidate.startPrep}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToolResultDialog open={activeDialog === 'interview-prep' && (!!result || !!rawText)} onOpenChange={(o) => { if (!o) closeDialog(); }} title="Interview Preparation Guide" icon={<Mic className="h-5 w-5 text-purple-600" />} result={result} rawText={rawText} error={error} copied={copied} onCopy={handleCopy} onClose={closeDialog} />
    </div>
  );
}
