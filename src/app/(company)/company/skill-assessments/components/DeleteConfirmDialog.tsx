// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sa: Record<string, string>;
  handleDeleteAssessment: () => void;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  sa,
  handleDeleteAssessment,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sa.deleteAssessment}</DialogTitle>
          <DialogDescription>{sa.deleteConfirm}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {sa.goBack}
          </Button>
          <Button variant="destructive" onClick={handleDeleteAssessment}>
            {sa.deleteAssessment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
