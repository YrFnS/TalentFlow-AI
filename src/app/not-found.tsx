'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">403 - Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don&apos;t have permission to access this page. Please sign in with
          an appropriate account.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
