// @ts-nocheck
'use client';

import type React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AnalysisResultView from './AnalysisResultView';

interface ToolResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: React.ReactNode;
  result: Record<string, unknown> | null;
  rawText: string | null;
  error: string | null;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export default function ToolResultDialog({
  open, onOpenChange, title, icon, result, rawText, error, copied, onCopy, onClose,
}: ToolResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{icon}{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[55vh]">
          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
              <p className="text-sm font-medium text-red-700">Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          )}
          {result && !rawText && <AnalysisResultView data={result} />}
          {rawText && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              <ReactMarkdown>{rawText}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
