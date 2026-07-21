import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useJobs } from '../context/useJobs';
import { useApplications } from '../context/useApplications';
import {
  Plus, CheckCircle, X, Briefcase, Users, Star, TrendingUp,
  ChevronDown, ChevronUp, MapPin, DollarSign, Sparkles, Search,
  Calendar, Award, Clock, Mail
} from 'lucide-react';

const STATUS_COLUMNS = [
  { key: 'Applied',   label: 'Applied',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  { key: 'Review',    label: 'In Review',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  { key: 'Interview', label: 'Interview',  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20'  },
  { key: 'Offer',     label: 'Offer',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'Rejected',  label: 'Rejected',   color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
];

const FORM_DEFAULTS = {
  title: '', type: 'Full-time', location: 'Remote',
  salary: '$120k – $150k', deadline: '', skills: '', desc: '', reqs: ''
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { jobs, addJob, fetchJobs } = useJobs();
  const { applications, updateApplicationStatus, fetchApplications } = useApplications();

  const [showPostForm, setShowPostForm] = useState(false);
  const [form, setForm]                 = useState(FORM_DEFAULTS);
  const [toast, setToast]               = useState('');
  const [formError, setFormError]       = useState('');
  const [selectedApp, setSelectedApp]   = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterJob, setFilterJob]       = useState('all');
  const [activeTab, setActiveTab]       = useState('pipeline');

  // Refresh jobs and applications from the server every time the recruiter loads the dashboard
  useEffect(() => {
    if (user?.role === 'recruiter') {
      fetchJobs();
      if (fetchApplications) fetchApplications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Please log in as a recruiter to access this dashboard.</p>
      </div>
    );
  }

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  // Show jobs that belong to this recruiter: match by posterId (newly posted) OR by company name
  const recruiterJobs = jobs.filter(j =>
    j.posterId === user.id ||
    (j.company && user.company && j.company.toLowerCase() === user.company.toLowerCase())
  );
  const jobIds        = recruiterJobs.map(j => j.id);
  const userCompanyLower = user.company?.toLowerCase() || '';
  // Show all submitted applications or filter by recruiter company if specified
  const allApps       = applications.filter(a => {
    if (!userCompanyLower && jobIds.length === 0) return true; // Show all applications if default demo recruiter
    return (
      jobIds.includes(a.jobId) ||
      (userCompanyLower && a.company && a.company.toLowerCase() === userCompanyLower) ||
      (recruiterJobs.length > 0 && recruiterJobs.some(rj => rj.id === a.jobId || rj.company?.toLowerCase() === a.company?.toLowerCase()))
    );
  });
  const filtered      = allApps
    .filter(a => filterJob === 'all' || a.jobId === filterJob)
    .filter(a =>
      a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectedJobApps = filterJob === 'all'
    ? allApps
    : allApps.filter(a => a.jobId === filterJob);

  const totalApps = selectedJobApps.length;
  const inReview  = selectedJobApps.filter(a => a.status === 'Review' || a.status === 'Interview').length;
  const offers    = selectedJobApps.filter(a => a.status === 'Offer').length;
  const avgMatch  = totalApps
    ? Math.round(selectedJobApps.reduce((s, a) => s + (a.matchScore || 0), 0) / totalApps)
    : 0;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 5000); };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Job title is required.'); return; }
    if (!form.skills.trim()) { setFormError('At least one skill is required.'); return; }
    if (!form.desc.trim()) { setFormError('Job description is required.'); return; }
    const company = user.company || user.name || 'My Company';
    const result = await addJob({
      title: form.title,
      company,
      logo: user.companyLogo || company[0] || 'R',
      logoBg: 'bg-indigo-600',
      location: form.location,
      type: form.type,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      description: form.desc,
      requirements: form.reqs.split(',').map(r => r.trim()).filter(Boolean),
      salary: form.salary,
      deadline: form.deadline || 'TBD',
      posterId: user.id,
      posterName: user.name,
      status: 'pending_approval',
    });
    setForm(FORM_DEFAULTS);
    setShowPostForm(false);
    if (result) {
      showToast('✅ Job posted! Awaiting admin approval before going live.');
    } else {
      showToast('⚠️ Job saved locally. Server sync failed — check your connection.');
    }
  };

  const handleStatus = (appId, status) => {
    const comments = {
      Interview: 'Interview scheduled by recruiter.',
      Offer:     'Offer extended. Check your email for details.',
      Rejected:  'Application reviewed. Thank you for your interest.',
      Review:    'Application moved to review stage.',
    };
    updateApplicationStatus(appId, status, comments[status] || '');
    if (selectedApp?.id === appId) setSelectedApp(prev => ({ ...prev, status }));
    showToast(`Candidate moved to ${status}.`);
  };

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300 mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            Recruiter workspace
          </div>
          <h1 className="text-3xl font-display font-black text-white">
            {user.company} <span className="text-gray-500 font-light">/ Hiring Hub</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">Post roles, review candidates, and move them through your pipeline.</p>
        </div>
        <button
          onClick={() => setShowPostForm(true)}
          className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Post a role
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total applicants', value: totalApps, icon: <Users className="w-4 h-4 text-indigo-400" />, desc: 'across all your roles' },
          { label: 'In pipeline',      value: inReview,  icon: <Clock className="w-4 h-4 text-amber-400" />,  desc: 'review or interview stage' },
          { label: 'Offers extended',  value: offers,    icon: <Award className="w-4 h-4 text-emerald-400" />,desc: 'awaiting candidate decision' },
          { label: 'Avg match score',  value: avgMatch ? `${avgMatch}%` : '—', icon: <Sparkles className="w-4 h-4 text-purple-400" />, desc: 'AI profile alignment' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <div className="mt-3 text-2xl font-black text-white">{s.value}</div>
            <div className="mt-1 text-xs text-gray-500">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
        {[{ key: 'pipeline', label: 'Candidate Pipeline' }, { key: 'postings', label: 'My Postings' }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === t.key ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pipeline tab ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidates or roles…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterJob}
              onChange={e => setFilterJob(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="all">All roles</option>
              {recruiterJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          {/* Status columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STATUS_COLUMNS.map(col => {
              const colApps = filtered.filter(a => a.status === col.key);
              return (
                <div key={col.key} className="space-y-3">
                  <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${col.border} ${col.bg}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                    <span className={`text-xs font-black ${col.color}`}>{colApps.length}</span>
                  </div>
                  {colApps.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-gray-600">No candidates</div>
                  ) : (
                    colApps.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className={`w-full text-left rounded-xl border p-3 space-y-2 transition text-xs ${
                          selectedApp?.id === app.id
                            ? 'border-indigo-500 bg-indigo-950/20'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] ${app.logoBg || 'bg-slate-600'}`}>
                            {app.logo || app.company?.[0] || '?'}
                          </span>
                          <span className="font-semibold text-white truncate">{app.studentName}</span>
                        </div>
                        <div className="text-gray-400 truncate">{app.jobTitle}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">{app.date}</span>
                          <span className="font-bold text-indigo-400">{app.matchScore}%</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Candidate detail panel */}
          {selectedApp && (
            <CandidateDetail
              app={selectedApp}
              onClose={() => setSelectedApp(null)}
              onStatus={handleStatus}
            />
          )}
        </div>
      )}

      {/* ── Postings tab ── */}
      {activeTab === 'postings' && (
        <div className="space-y-4">
          {recruiterJobs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-16 text-center">
              <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-semibold mb-1">No roles posted yet</p>
              <p className="text-sm text-gray-500 mb-6">Post your first role to start receiving applications.</p>
              <button
                onClick={() => setShowPostForm(true)}
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition"
              >
                Post a role
              </button>
            </div>
          ) : (
            recruiterJobs.map(job => {
              const jobApps = allApps.filter(a => a.jobId === job.id);
              const appCount = jobApps.length;
              const inReviewCount = jobApps.filter(a => a.status === 'Review' || a.status === 'Interview').length;
              const offerCount = jobApps.filter(a => a.status === 'Offer').length;
              const avgScore = appCount
                ? Math.round(jobApps.reduce((s, a) => s + (a.matchScore || 0), 0) / appCount)
                : 0;
              return (
                <div key={job.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${job.logoBg || 'bg-slate-600'}`}>
                      {job.logo || job.company?.[0]}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{job.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{job.type} · {job.location} · {job.salary}</div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-400">
                        <span>Applicants: <strong className="text-white font-bold">{appCount}</strong></span>
                        <span className="text-white/20">•</span>
                        <span>In Review: <strong className="text-amber-400 font-bold">{inReviewCount}</strong></span>
                        <span className="text-white/20">•</span>
                        <span>Offers: <strong className="text-emerald-400 font-bold">{offerCount}</strong></span>
                        <span className="text-white/20">•</span>
                        <span>Avg Match: <strong className="text-purple-400 font-bold">{avgScore ? `${avgScore}%` : '—'}</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skills && job.skills.slice(0, 4).map(s => (
                          <span key={s} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gray-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                      job.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      job.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {job.status === 'active' ? 'Live' : job.status === 'rejected' ? 'Rejected' : 'Pending approval'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Post Job Modal ── */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-display font-black text-white">Post a New Role</h2>
                <p className="text-sm text-gray-400 mt-1">Fill in the details below. The role will go live after admin approval.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowPostForm(false); setFormError(''); setForm(FORM_DEFAULTS); }}
                className="rounded-xl border border-white/10 p-2 text-gray-400 hover:text-white hover:border-white/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handlePostJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Job Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={form.title}
                    onChange={set('title')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Employment Type</label>
                  <select
                    value={form.type}
                    onChange={set('type')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, New York, NY"
                    value={form.location}
                    onChange={set('location')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $120k – $150k"
                    value={form.salary}
                    onChange={set('salary')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Application Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={set('deadline')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Required Skills * <span className="normal-case font-normal text-gray-500">(comma-separated)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                    value={form.skills}
                    onChange={set('skills')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Job Description *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the role, responsibilities, and what the candidate will be working on…"
                    value={form.desc}
                    onChange={set('desc')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition resize-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Requirements <span className="normal-case font-normal text-gray-500">(comma-separated)</span></label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 3+ years React experience, Bachelor's in CS, Strong communication skills"
                    value={form.reqs}
                    onChange={set('reqs')}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowPostForm(false); setFormError(''); setForm(FORM_DEFAULTS); }}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
                >
                  Post Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function CandidateDetail({ app, onClose, onStatus }) {
  const { getAuthToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE}/api/users/${app.studentId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (active && res.ok && data.user) {
          setProfile(data.user);
        }
      } catch (err) {
        console.error('Error loading candidate profile:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [app.studentId, getAuthToken, API_BASE]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/resumes/download/${app.studentId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error('Resume not found on server');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = profile?.resumeName || `${app.studentName}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Error downloading resume');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/90 p-6 md:p-8 shadow-2xl text-left space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/5 pb-4">
          <div>
            <h2 className="text-2xl font-display font-black text-white">{app.studentName}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-indigo-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {app.studentEmail}
              </span>
              {profile?.major && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{profile.major} ({profile.graduationYear || 'N/A'})</span>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <span className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></span>
            <span className="text-xs">Loading candidate CV analysis...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">Role Match Score</span>
                <div className="mt-2 text-3xl font-black text-indigo-400">{app.matchScore}%</div>
                <span className="text-[10px] text-gray-500 mt-1 block">to Job Description</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">Overall CV Quality</span>
                <div className="mt-2 text-3xl font-black text-emerald-400">{profile?.resumeScore || '—'} / 100</div>
                <span className="text-[10px] text-gray-500 mt-1 block">AI NLP Parser rating</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">ATS Readiness</span>
                <div className="mt-2 text-3xl font-black text-amber-400">{profile?.atsScore || '—'}%</div>
                <span className="text-[10px] text-gray-500 mt-1 block">Estimated scanner compatibility</span>
              </div>
            </div>

            {/* Resume File & Download */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white truncate max-w-xs">{profile?.resumeName || 'Resume.pdf'}</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">Uploaded PDF format</div>
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading || !profile?.resumeUploaded}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-gray-600 px-4 py-2.5 font-semibold text-white transition cursor-pointer"
              >
                {downloading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin"></span>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <span>Download CV PDF</span>
                  </>
                )}
              </button>
            </div>

            {profile?.feedback ? (
              <div className="space-y-4">
                {/* Strengths */}
                {profile.feedback.strengths && profile.feedback.strengths.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Strengths Detected</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      {profile.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {profile.feedback.weaknesses && profile.feedback.weaknesses.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-rose-400 flex items-center gap-1.5 text-left">
                      <span>Missing Keywords / Weaknesses</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      {profile.feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {profile.feedback.suggestions && profile.feedback.suggestions.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Actionable AI Recommendations</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                      {profile.feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-center text-xs text-gray-500">
                No AI Resume feedback is stored for this candidate yet.
              </div>
            )}

            {/* Candidate Skills */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white">Skills Tagged</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map(s => (
                    <span key={s} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-gray-300">{s}</span>
                  ))
                ) : (
                  <span className="text-gray-600">No skills listed</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 justify-end">
          <button
            onClick={() => { onStatus(app.id, 'Review'); onClose(); }}
            className="rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition cursor-pointer"
          >
            Move to Review
          </button>
          <button
            onClick={() => { onStatus(app.id, 'Interview'); onClose(); }}
            className="rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 text-xs font-semibold text-purple-300 transition cursor-pointer"
          >
            Schedule Interview
          </button>
          <button
            onClick={() => { onStatus(app.id, 'Offer'); onClose(); }}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition cursor-pointer"
          >
            Extend Offer
          </button>
          <button
            onClick={() => { onStatus(app.id, 'Rejected'); onClose(); }}
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition cursor-pointer"
          >
            Reject Application
          </button>
        </div>

      </div>
    </div>
  );
}
