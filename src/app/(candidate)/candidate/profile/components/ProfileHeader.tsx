'use client';

import { Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  lastSavedAt?: Date | null;
}

export default function ProfileHeader({
  onSave,
  saving,
  dirty,
  lastSavedAt,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          My profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your candidate information accurate for applications and recruiter
          review.
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {dirty ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {lastSavedAt
                ? `Saved ${lastSavedAt.toLocaleTimeString()}`
                : 'Profile loaded'}
            </>
          )}
        </p>
      </div>
      <Button onClick={onSave} disabled={saving || !dirty}>
        {saving ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="me-2 h-4 w-4" />
        )}
        Save profile
      </Button>
    </div>
  );
}
