'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Sparkles, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent" />
          <span className="text-slate-400 text-sm">Synchronizing account...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span>Agentic CV</span>
              </Link>
              <nav className="hidden md:flex gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Master Profile</span>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-slate-200">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                <span className="text-slate-500">{user.email}</span>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-sm text-slate-400 hover:text-white transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
