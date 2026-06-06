'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiRequest } from '@/utils/api';
import { 
  Sparkles, FileText, ArrowRight, Plus, 
  Trash2, Briefcase, Calendar, CheckCircle2, RefreshCw 
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
      {/* Welcome & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Applicant Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your master profile and generate tailored CV applications.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-all text-sm"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Ingest Profile</span>
          </button>
          
          {!isProfileEmpty && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-semibold rounded-xl shadow-lg shadow-emerald-500/10 transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tailor New CV</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 mb-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {isProfileEmpty ? 'Setup Required' : 'Active Profile'}
              </span>
              {profile?.primary_title && (
                <span className="text-xs text-slate-400">({profile.primary_title})</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">Your Master Profile</h3>
            <p className="text-slate-400 text-sm mt-1">
              {isProfileEmpty 
                ? "You haven't setup your career details yet. Upload your current CV to start."
                : `Contains ${profile?.experiences?.length || 0} Work Experiences, ${profile?.projects?.length || 0} Projects, and ${profile?.education?.length || 0} Education milestones.`}
            </p>
          </div>
          
          <div className="flex gap-2">
            {isProfileEmpty ? (
              <>
                <button
                  onClick={() => setShowIngestModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-semibold rounded-xl text-sm transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Ingest Resume</span>
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-200 hover:text-white transition-all hover:bg-slate-900"
                >
                  <span>Edit Manually</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-200 hover:text-white transition-all hover:bg-slate-900"
              >
                <span>View & Edit Profile</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Past Applications List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Tailoring History</h2>
        
        {applications.length === 0 ? (
          <div className="bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl py-12 px-4 text-center">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-300">No applications tailored yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Ready to apply? Click "Tailor New CV" to start matching your experience with specific jobs.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <div 
                key={app.id}
                onClick={() => router.push(`/applications/${app.id}`)}
                className="bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all hover:border-slate-700/80"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {app.job_title}
                    </h4>
                    <p className="text-slate-400 text-sm mt-0.5">{app.company}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-800/50 sm:border-0 pt-3 sm:pt-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {app.status}
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingest Resume Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Ingest Raw Resume</h3>
            <p className="text-slate-400 text-sm mb-4">Paste your current resume details below. The parser agent will automatically organize it into your Master Profile.</p>
            
            <form onSubmit={handleIngestResume} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={10}
                  value={rawResume}
                  onChange={(e) => setRawResume(e.target.value)}
                  placeholder="Paste work experience, bullet points, skills, and education history here..."
                  className="block w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-600 text-sm transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowIngestModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingestLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-semibold rounded-xl text-sm"
                >
                  {ingestLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-black border-r-transparent border-b-black border-l-transparent" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <span>Parse & Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailor Resume Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Tailor Resume for New Job</h3>
            <p className="text-slate-400 text-sm mb-4">Input target role information. The agent workflow will align achievements with these specifications.</p>
            
            <form onSubmit={handleGenerateCV} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Developer"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-600 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                <textarea
                  required
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste full job description listing requirements, skills, and expectations..."
                  className="block w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-white placeholder-slate-600 text-sm transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-semibold rounded-xl text-sm"
                >
                  {generateLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Orchestrating Agents...</span>
                    </>
                  ) : (
                    <span>Execute Tailoring</span>
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
