'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiRequest } from '@/utils/api';
import { 
  Plus, Trash2, Save, FileText, 
  MapPin, Link as LinkIcon, Phone, Mail,
  User, Briefcase, Award, GraduationCap, ChevronRight, CheckCircle2
} from 'lucide-react';

export default function ProfilePage() {
  const [profileId, setProfileId] = useState('');
  const [primaryTitle, setPrimaryTitle] = useState('');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    location: '',
  });
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'projects' | 'education'>('personal');

  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/profile');
      setProfileId(data.id);
      setPrimaryTitle(data.primary_title || '');
      setContactInfo({
        phone: data.contact_info?.phone || '',
        linkedin: data.contact_info?.linkedin || '',
        github: data.contact_info?.github || '',
        website: data.contact_info?.website || '',
        location: data.contact_info?.location || '',
      });
      setExperiences(data.experiences || []);
      setProjects(data.projects || []);
      setEducation(data.education || []);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    // Clean data before submitting
    const payload = {
      primary_title: primaryTitle,
      contact_info: contactInfo,
      experiences: experiences.map(exp => ({
        company: exp.company,
        role: exp.role,
        start_date: exp.start_date,
        end_date: exp.end_date,
        bullet_points: exp.bullet_points.filter((b: string) => b.trim() !== '')
      })),
      projects: projects.map(proj => ({
        title: proj.title,
        description: proj.description,
        url: proj.url,
        achievements: proj.achievements.filter((a: string) => a.trim() !== '')
      })),
      education: education.map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        grad_date: edu.grad_date
      }))
    };

    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMessage('Master Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // EXPERIENCE MANAGERS
  const addExperience = () => {
    setExperiences([...experiences, {
      company: '',
      role: '',
      start_date: '',
      end_date: '',
      bullet_points: ['']
    }]);
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...experiences];
    updated[index][field] = value;
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addExpBullet = (expIndex: number) => {
    const updated = [...experiences];
    updated[expIndex].bullet_points.push('');
    setExperiences(updated);
  };

  const updateExpBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...experiences];
    updated[expIndex].bullet_points[bulletIndex] = value;
    setExperiences(updated);
  };

  const removeExpBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experiences];
    updated[expIndex].bullet_points = updated[expIndex].bullet_points.filter((_: any, i: number) => i !== bulletIndex);
    setExperiences(updated);
  };

  // PROJECT MANAGERS
  const addProject = () => {
    setProjects([...projects, {
      title: '',
      description: '',
      url: '',
      achievements: ['']
    }]);
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const addProjAchievement = (projIndex: number) => {
    const updated = [...projects];
    updated[projIndex].achievements.push('');
    setProjects(updated);
  };

  const updateProjAchievement = (projIndex: number, achIndex: number, value: string) => {
    const updated = [...projects];
    updated[projIndex].achievements[achIndex] = value;
    setProjects(updated);
  };

  const removeProjAchievement = (projIndex: number, achIndex: number) => {
    const updated = [...projects];
    updated[projIndex].achievements = updated[projIndex].achievements.filter((_: any, i: number) => i !== achIndex);
    setProjects(updated);
  };

  // EDUCATION MANAGERS
  const addEducation = () => {
    setEducation([...education, {
      school: '',
      degree: '',
      field_of_study: '',
      grad_date: ''
    }]);
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
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

  return (
    <DashboardLayout>
      {/* Title & Save Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Master Career Profile
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Maintain your source achievements. Our agent tailors select, rephrase, and review details from this pool.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all text-sm disabled:opacity-50 active:scale-95 w-full sm:w-auto justify-center"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}

      {/* Main Tabbed Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Nav (3 cols) */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-1 shadow-lg">
          <button
            onClick={() => setActiveTab('personal')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'personal' 
                ? 'bg-slate-900 text-emerald-400 border border-slate-800' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="h-4.5 w-4.5" />
              <span>Personal Details</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'experience' 
                ? 'bg-slate-900 text-emerald-400 border border-slate-800' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-4.5 w-4.5" />
              <span>Work Experience</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'projects' 
                ? 'bg-slate-900 text-emerald-400 border border-slate-800' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Award className="h-4.5 w-4.5" />
              <span>Projects & Work</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'education' 
                ? 'bg-slate-900 text-emerald-400 border border-slate-800' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-4.5 w-4.5" />
              <span>Education</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        </div>

        {/* Tab Contents Frame (9 cols) */}
        <div className="lg:col-span-9 bg-slate-900/20 border border-slate-850 rounded-2xl p-6 backdrop-blur-xl shadow-xl min-h-[450px]">
          
          {/* TAB 1: PERSONAL & CONTACT */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-850 pb-4 mb-2">
                <h3 className="text-lg font-bold text-white">Identity & Contacts</h3>
                <p className="text-xs text-slate-500">Provide basic reach details and your primary title target.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Career Title</label>
                  <input
                    type="text"
                    value={primaryTitle}
                    onChange={(e) => setPrimaryTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer | React Specialist"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.location}
                    onChange={(e) => setContactInfo({ ...contactInfo, location: e.target.value })}
                    placeholder="City, Country"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    <span>LinkedIn URL</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.linkedin}
                    onChange={(e) => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    <span>GitHub URL</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.github}
                    onChange={(e) => setContactInfo({ ...contactInfo, github: e.target.value })}
                    placeholder="https://github.com/username"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    <span>Personal Website</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo.website}
                    onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-slate-200 placeholder-slate-650 text-xs transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORK EXPERIENCES */}
          {activeTab === 'experience' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">Work History</h3>
                  <p className="text-xs text-slate-500">Add positions. The agent will rephrase these bullets to fit target jobs.</p>
                </div>
                <button
                  onClick={addExperience}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-950 border border-slate-850 hover:border-slate-750 text-xs font-bold rounded-lg text-emerald-400 hover:text-emerald-300 transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {experiences.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-sm">
                  No work experience entries yet. Click "Add Role" to start.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-slate-850/80 space-y-8">
                  {experiences.map((exp, expIdx) => (
                    <div key={expIdx} className="relative bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                      {/* Timeline Bullet Node */}
                      <span className="absolute -left-[31px] top-7 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
                      
                      <button
                        onClick={() => removeExperience(expIdx)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company</label>
                          <input
                            type="text"
                            required
                            value={exp.company}
                            onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                            placeholder="e.g. Google"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role / Position</label>
                          <input
                            type="text"
                            required
                            value={exp.role}
                            onChange={(e) => updateExperience(expIdx, 'role', e.target.value)}
                            placeholder="e.g. Staff Engineer"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                          <input
                            type="text"
                            required
                            value={exp.start_date}
                            onChange={(e) => updateExperience(expIdx, 'start_date', e.target.value)}
                            placeholder="e.g. Jan 2020"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                          <input
                            type="text"
                            value={exp.end_date || ''}
                            onChange={(e) => updateExperience(expIdx, 'end_date', e.target.value)}
                            placeholder="e.g. Dec 2023 or Present"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Accomplishments list */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Achievements</label>
                          <button
                            type="button"
                            onClick={() => addExpBullet(expIdx)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Achievement</span>
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {exp.bullet_points.map((bullet: string, bIdx: number) => (
                            <div key={bIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => updateExpBullet(expIdx, bIdx, e.target.value)}
                                placeholder="Describe a contribution, framework used, and measurable impact."
                                className="block flex-1 px-3 py-2 bg-slate-950 border border-slate-855 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 text-slate-200 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => removeExpBullet(expIdx, bIdx)}
                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">Projects</h3>
                  <p className="text-xs text-slate-500">Details of side creations or open-source works.</p>
                </div>
                <button
                  onClick={addProject}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-950 border border-slate-855 hover:border-slate-750 text-xs font-bold rounded-lg text-emerald-400 hover:text-emerald-300 transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-sm">
                  No projects added yet. Click "Add Project" to start.
                </div>
              ) : (
                <div className="space-y-6">
                  {projects.map((proj, projIdx) => (
                    <div key={projIdx} className="p-5 bg-slate-950/40 border border-slate-850 rounded-xl relative space-y-4">
                      <button
                        onClick={() => removeProject(projIdx)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project Title</label>
                          <input
                            type="text"
                            required
                            value={proj.title}
                            onChange={(e) => updateProject(projIdx, 'title', e.target.value)}
                            placeholder="e.g. Blockchain Rollup Indexer"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project URL</label>
                          <input
                            type="text"
                            value={proj.url || ''}
                            onChange={(e) => updateProject(projIdx, 'url', e.target.value)}
                            placeholder="e.g. github.com/username/project"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">General Description</label>
                          <input
                            type="text"
                            value={proj.description || ''}
                            onChange={(e) => updateProject(projIdx, 'description', e.target.value)}
                            placeholder="A concise summary of what this project accomplished."
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Achievements */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Achievements</label>
                          <button
                            type="button"
                            onClick={() => addProjAchievement(projIdx)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Achievement</span>
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {proj.achievements.map((ach: string, aIdx: number) => (
                            <div key={aIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={ach}
                                onChange={(e) => updateProjAchievement(projIdx, aIdx, e.target.value)}
                                placeholder="Quantifiable outcomes (e.g. 'Improved indexing throughput by 40%')"
                                className="block flex-1 px-3 py-2 bg-slate-950 border border-slate-855 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 text-slate-200 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => removeProjAchievement(projIdx, aIdx)}
                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">Education History</h3>
                  <p className="text-xs text-slate-500">Add degree details, diplomas, or certifications.</p>
                </div>
                <button
                  onClick={addEducation}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-950 border border-slate-850 hover:border-slate-750 text-xs font-bold rounded-lg text-emerald-400 hover:text-emerald-300 transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              {education.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-850 rounded-xl text-center text-slate-500 text-sm">
                  No education records yet. Click "Add Education" to start.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-slate-850/80 space-y-8">
                  {education.map((edu, eduIdx) => (
                    <div key={eduIdx} className="relative bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                      {/* Timeline Bullet Node */}
                      <span className="absolute -left-[31px] top-7 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />

                      <button
                        onClick={() => removeEducation(eduIdx)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">School / Institution</label>
                          <input
                            type="text"
                            required
                            value={edu.school}
                            onChange={(e) => updateEducation(eduIdx, 'school', e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Degree</label>
                          <input
                            type="text"
                            required
                            value={edu.degree}
                            onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Field of Study</label>
                          <input
                            type="text"
                            required
                            value={edu.field_of_study}
                            onChange={(e) => updateEducation(eduIdx, 'field_of_study', e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Graduation Date</label>
                          <input
                            type="text"
                            required
                            value={edu.grad_date}
                            onChange={(e) => updateEducation(eduIdx, 'grad_date', e.target.value)}
                            placeholder="e.g. June 2021"
                            className="block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
