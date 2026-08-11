import { Suspense } from 'react';
import RegisterPageContent from './content';

function RegisterPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label="Loading registration page"
      />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
