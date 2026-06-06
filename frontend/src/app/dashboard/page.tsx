'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiRequest } from '@/utils/api';
import { 
  Sparkles, FileText, ArrowRight, Plus, 
  Trash2, Briefcase, Calendar, CheckCircle2, 
  RefreshCw, Award, Activity, Check, Download, AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  
  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  
  // Form fields
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [rawResume, setRawResume] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profileData = await apiRequest('/api/profile');
      setProfile(profileData);
      
      const apps = await apiRequest('/api/applications');
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIngestLoading(true);
    try {
      const updatedProfile = await apiRequest('/api/ingest-resume', {
        method: 'POST',
        body: JSON.stringify({ resume_text: rawResume }),
      });
      setProfile(updatedProfile);
      setRawResume('');
      setShowIngestModal(false);
    } catch (err: any) {
      setError(err.message || 'Parsing failed.');
    } finally {
      setIngestLoading(false);
    }
  };

  const handleGenerateCV = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGenerateLoading(true);
    try {
      const result = await apiRequest('/api/generate-cv', {
        method: 'POST',
        body: JSON.stringify({
          job_title: jobTitle,
          job_description: jobDescription
        }),
      });
      setShowGenerateModal(false);
      setJobTitle('');
      setJobDescription('');
      router.push(`/applications/${result.application_id}`);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setGenerateLoading(false);
    }
  };

  const isProfileEmpty = !profile || (profile.experiences.length === 0 && profile.projects.length === 0);

  // Dynamic Statistics Calculations
  const totalApps = applications.length;
  const averageScore = applications.length > 0
    ? Math.round(applications.reduce((acc, a) => acc + (a.critic_score || 85), 0) / applications.length)
    : 0;

  let profileCompleteness = 0;
  if (profile) {
    if (profile.primary_title) profileCompleteness += 20;
    if (profile.contact_info && Object.keys(profile.contact_info).length > 0) profileCompleteness += 20;
    if (profile.experiences?.length > 0) profileCompleteness += 25;
    if (profile.projects?.length > 0) profileCompleteness += 20;
    if (profile.education?.length > 0) profileCompleteness += 15;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome & Dashboard Actions Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Applicant Dashboard
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Leverage multi-agent tailors to match your master profile against job descriptions instantly.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Ingest Profile</span>
          </button>
          
          {!isProfileEmpty && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tailor New CV</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Stat 1: Total Applications */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex items-center justify-between shadow-xl">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Applications Tailored</span>
            <span className="text-3xl font-black text-white">{totalApps}</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-emerald-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2: Avg. Match Score */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex items-center justify-between shadow-xl">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Average Match Score</span>
            <span className="text-3xl font-black text-white">{averageScore}%</span>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3: Profile Completeness */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between gap-4 shadow-xl">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Profile Completeness</span>
            <span className="text-sm font-black text-emerald-400">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full border border-slate-850 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Onboarding or Active Profile Summary */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 mb-10 backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isProfileEmpty 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {isProfileEmpty ? 'Setup Required' : 'Active Profile'}
              </span>
              {profile?.primary_title && (
                <span className="text-xs text-slate-500 font-medium">({profile.primary_title})</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">Your Master Profile Workspace</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              {isProfileEmpty 
                ? "You haven't setup your career details yet. Upload your current CV to let our parser agent auto-structure it."
                : `Active and loaded. Contains ${profile?.experiences?.length || 0} Work Milestone(s), ${profile?.projects?.length || 0} Project(s), and ${profile?.education?.length || 0} Education entry.`}
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {isProfileEmpty ? (
              <>
                <button
                  onClick={() => setShowIngestModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Ingest Resume</span>
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-200 hover:text-white transition-all"
                >
                  <span>Edit Manually</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/profile')}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-200 hover:text-white transition-all hover:bg-slate-900"
              >
                <span>View & Edit Profile</span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid List: Card-Based Tailoring History */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Tailoring History</h2>
          {totalApps > 0 && <span className="text-xs text-slate-500 font-bold uppercase">{totalApps} Version(s)</span>}
        </div>
        
        {applications.length === 0 ? (
          <div className="bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl py-16 px-4 text-center shadow-inner">
            <Briefcase className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-300">No applications tailored yet</h3>
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              Click **Tailor New CV** to execute the multi-agent tailoring workflow on your target job description.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app) => {
              const compInitials = app.company ? app.company.substring(0, 2).toUpperCase() : 'JO';
              return (
                <div 
                  key={app.id}
                  onClick={() => router.push(`/applications/${app.id}`)}
                  className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-750 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/2"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sm font-black text-emerald-400 group-hover:border-emerald-500/20 group-hover:bg-emerald-500/5 transition-all">
                        {compInitials}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                          {app.job_title}
                        </h4>
                        <p className="text-slate-400 text-xs mt-1 font-semibold">{app.company}</p>
                      </div>
                    </div>
                    
                    <span className="text-[14px] font-black text-white bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg">
                      {app.critic_score || 85}% Match
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-850/50 pt-4 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {app.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ingest Resume Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-1.5">Ingest Raw Resume</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Paste raw resume content below (experiences, achievements, school history). The AI Ingestion Agent parses and formats your master profile.
            </p>
            
            <form onSubmit={handleIngestResume} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={10}
                  value={rawResume}
                  onChange={(e) => setRawResume(e.target.value)}
                  placeholder="e.g. Google Inc. - Software Engineer (2022-Present)&#10;- Led backend redesign using Python and FastAPI..."
                  className="block w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs font-mono transition-all leading-normal"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowIngestModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingestLoading}
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {ingestLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Parsing Resume...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Parse & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailor Resume Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-1.5">Tailor Resume for New Job</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Enter target role credentials. Our LangGraph workflow coordinates researchers, matchers, and critics to optimize your bullet points.
            </p>
            
            <form onSubmit={handleGenerateCV} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Description</label>
                <textarea
                  required
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details, key skills, and requirements from the listing here..."
                  className="block w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all leading-normal"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {generateLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Orchestrating Agents...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-slate-950" />
                      <span>Execute Tailoring</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
