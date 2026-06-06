'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiRequest } from '@/utils/api';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, ArrowLeft, Copy, Check, FileText, 
  BookOpen, Eye, Award, Settings, CheckCircle2 
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState('');
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter' | 'json'>('resume');

  useEffect(() => {
    fetchApplicationDetails();
  }, [appId]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/applications/${appId}`);
      setApp(data);
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!app) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-slate-300">Application not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Helper to compile tailored resume data into markdown string dynamically
  const generateMarkdownResume = (data: any) => {
    if (!data) return '';
    let md = `# ${data.contact_info?.name || 'Curriculum Vitae'}\n`;
    if (data.primary_title) md += `**${data.primary_title}**\n\n`;
    
    // Contact Info
    const contacts = [];
    if (data.contact_info?.location) contacts.push(data.contact_info.location);
    if (data.contact_info?.phone) contacts.push(data.contact_info.phone);
    if (data.contact_info?.linkedin) contacts.push(`[LinkedIn](${data.contact_info.linkedin})`);
    if (data.contact_info?.github) contacts.push(`[GitHub](${data.contact_info.github})`);
    if (data.contact_info?.website) contacts.push(`[Website](${data.contact_info.website})`);
    if (contacts.length > 0) md += contacts.join('  |  ') + '\n\n---\n\n';

    // Work Experience
    if (data.experiences && data.experiences.length > 0) {
      md += `## Professional Experience\n\n`;
      data.experiences.forEach((exp: any) => {
        md += `### ${exp.role} \n**${exp.company}**  |  *${exp.start_date} – ${exp.end_date || 'Present'}*\n\n`;
        if (exp.bullet_points) {
          exp.bullet_points.forEach((bullet: string) => {
            md += `- ${bullet}\n`;
          });
        }
        md += '\n';
      });
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      md += `## Key Projects\n\n`;
      data.projects.forEach((proj: any) => {
        md += `### ${proj.title}\n`;
        if (proj.url) md += `*Project URL: [Link](${proj.url})*\n\n`;
        if (proj.description) md += `${proj.description}\n\n`;
        if (proj.achievements) {
          proj.achievements.forEach((ach: string) => {
            md += `- ${ach}\n`;
          });
        }
        md += '\n';
      });
    }

    // Education
    if (data.education && data.education.length > 0) {
      md += `## Education\n\n`;
      data.education.forEach((edu: any) => {
        md += `### ${edu.degree} in ${edu.field_of_study}\n**${edu.school}**  |  *Graduated: ${edu.grad_date}*\n\n`;
      });
    }

    return md;
  };

  const resumeMarkdown = generateMarkdownResume(app.tailored_cv_data);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tailored Results</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {app.job.title} at {app.job.company}
          </h1>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Job details & Critic Score (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Critic Evaluation Gauge */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-emerald-400" />
              <span>ATS match score & Feedback</span>
            </h3>

            <div className="flex flex-col items-center py-4">
              {/* Radial Score Indicator */}
              <div className="relative flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#34d399"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - app.critic_score / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white">{app.critic_score}%</span>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Match Score</span>
                </div>
              </div>

              {/* Feedback Summary */}
              {app.critic_feedback && (
                <div className="w-full mt-4 bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-300 mb-1">Agent Feedback:</p>
                  {app.critic_feedback}
                </div>
              )}
            </div>
          </div>

          {/* Target Job Specifications */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-emerald-400" />
              <span>Target Job Specifications</span>
            </h3>
            <div className="max-h-72 overflow-y-auto pr-2 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
              {app.job.description}
            </div>
          </div>

        </div>

        {/* Right Side: Compiled Previews & Copy Actions (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col min-h-[600px]">
          
          {/* Tabs Bar */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-4 py-3 justify-between items-center flex-wrap gap-4">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'resume' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Tailored CV Markdown
              </button>
              <button
                onClick={() => setActiveTab('cover_letter')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'cover_letter' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'json' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Structured JSON
              </button>
            </div>

            {/* Quick Copy Button */}
            <div>
              {activeTab === 'resume' && (
                <button
                  onClick={() => handleCopyToClipboard(resumeMarkdown, 'resume')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold rounded-lg transition-all"
                >
                  {copiedText === 'resume' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedText === 'resume' ? 'Copied Resume!' : 'Copy Resume'}</span>
                </button>
              )}
              
              {activeTab === 'cover_letter' && (
                <button
                  onClick={() => handleCopyToClipboard(app.cover_letter, 'letter')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold rounded-lg transition-all"
                >
                  {copiedText === 'letter' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedText === 'letter' ? 'Copied Cover Letter!' : 'Copy Cover Letter'}</span>
                </button>
              )}

              {activeTab === 'json' && (
                <button
                  onClick={() => handleCopyToClipboard(JSON.stringify(app.tailored_cv_data, null, 2), 'json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold rounded-lg transition-all"
                >
                  {copiedText === 'json' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedText === 'json' ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Previews Frame */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
            {activeTab === 'resume' && (
              <div className="prose prose-invert prose-emerald max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                <ReactMarkdown>{resumeMarkdown}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'cover_letter' && (
              <div className="prose prose-invert prose-emerald max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                <ReactMarkdown>{app.cover_letter}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'json' && (
              <pre className="text-xs text-emerald-400 bg-slate-950 p-4 rounded-xl overflow-x-auto border border-slate-900 font-mono">
                {JSON.stringify(app.tailored_cv_data, null, 2)}
              </pre>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
