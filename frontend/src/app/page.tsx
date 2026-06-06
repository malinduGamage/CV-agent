'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirection is also managed by AuthProvider, but this acts as an explicit client landing redirect
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent" />
        <span className="text-slate-500 text-sm">Redirecting to Dashboard...</span>
      </div>
    </div>
  );
}
