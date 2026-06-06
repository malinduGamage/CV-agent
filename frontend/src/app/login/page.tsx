'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        
        // Supabase sends a confirmation email by default unless email verification is disabled.
        // Provide feedback.
        if (data.session) {
          router.push('/dashboard');
        } else {
          setMessage('Check your email to confirm your account subscription.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Agentic CV System</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {isSignUp ? 'sign in to existing account' : 'register a new account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl py-8 px-4 border border-slate-800/80 shadow-2xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-500 sm:text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-sm">
                <span>{message}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 transition-all font-semibold"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
