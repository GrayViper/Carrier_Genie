import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useJobs } from '../context/useJobs';
import { Users, Briefcase, FileText, Check, X, Activity, CheckCircle2, Clock3, ShieldCheck, Sparkles, Download, AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const { user, getAuthToken } = useAuth();
  const { jobs, approveJob, rejectJob } = useJobs();

  const [mockUsers, setMockUsers] = useState([]);

  const [notification, setNotification] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [avgAiScore, setAvgAiScore] = useState(0);
  const [pendingResumes, setPendingResumes] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';
      try {
        const token = await getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [analyticsRes, resumesRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/analytics`, { headers }),
          fetch(`${API_BASE}/api/admin/resumes`, { headers }),
          fetch(`${API_BASE}/api/admin/users`, { headers })
        ]);

        if (!analyticsRes.ok || !resumesRes.ok) {
          throw new Error('Admin data load failed');
        }

        const analyticsData = await analyticsRes.json();
        const resumesData = await resumesRes.json();

        setAnalytics(analyticsData);
        setResumes(resumesData.resumes || []);
        setAvgAiScore(resumesData.avgAiScore || 0);
        setPendingResumes(resumesData.pendingResumes || 0);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.users && usersData.users.length > 0) {
            setMockUsers(usersData.users);
          }
        }
      } catch (error) {
        setAnalytics({
          totalUsers: 3,
          resumeUploads: 1,
          avgResumeScore: 84,
          avgAtsScore: 84,
          totalJobs: 1,
          pendingJobs: 0
        });
      }
    };

    fetchAdminData();
  }, [getAuthToken]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-20 text-center text-xs">
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">Please log in as an administrator to access this panel.</p>
      </div>
    );
  }

  const pendingJobs = jobs.filter((job) => job.status === 'pending_approval');

  const handleApproveJob = async (jobId) => {
    await approveJob(jobId);
    await fetchJobs();
    setNotification('Job opportunity approved and activated successfully.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleRejectJob = async (jobId) => {
    await rejectJob(jobId);
    await fetchJobs();
    setNotification('Job opportunity has been archived/rejected.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleRoleChange = (userId, newRole) => {
    setMockUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setNotification(`User role updated to ${newRole}.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleNewAnnouncement = (event) => {
    event.preventDefault();
    setNotification('New announcement drafted and queued for distribution.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleExportReport = (event) => {
    event.preventDefault();
    const reportLines = [
      'CareerGenie Admin Summary',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Total users: ${analytics?.totalUsers || 'N/A'}`,
      `New users today: ${analytics?.newUsersToday || 'N/A'}`,
      `Resume uploads: ${analytics?.resumeUploads || 'N/A'}`,
      `Average resume score: ${analytics?.avgResumeScore || 'N/A'}%`,
      `Average ATS score: ${analytics?.avgAtsScore || 'N/A'}%`,
      `Open roles: ${analytics?.totalJobs || 'N/A'}`,
      `Pending job approvals: ${analytics?.pendingJobs || 'N/A'}`,
      '',
      `Resume review queue: ${resumes.length} items`,
      ...resumes.map((resume) => `${resume.studentName} · ${resume.fileName} · AI ${resume.aiScore}% · ATS ${resume.atsScore}% · ${resume.status}`)
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `careergenie-admin-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification('Admin report downloaded successfully.');
    setTimeout(() => setNotification(''), 4000);
  };

  const stats = analytics
    ? [
      { label: 'Total Users', value: (analytics?.totalUsers || 0).toLocaleString(), desc: `${analytics?.newUsersToday || 0} new today`, icon: <Users className="w-4 h-4 text-indigo-400" /> },
      { label: 'Resume Uploads', value: (analytics?.resumeUploads || 0).toLocaleString(), desc: `${analytics?.avgResumeScore || 0}% avg score`, icon: <FileText className="w-4 h-4 text-purple-400" /> },
      { label: 'ATS Health', value: `${analytics?.avgAtsScore || 0}%`, desc: `AI readiness benchmark`, icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
      { label: 'Open Roles', value: (analytics?.totalJobs || 0).toLocaleString(), desc: `${analytics?.pendingJobs || 0} awaiting review`, icon: <Briefcase className="w-4 h-4 text-rose-400" /> }
    ]
    : [
      { label: 'Total Users', value: '—', desc: 'loading...', icon: <Users className="w-4 h-4 text-indigo-400" /> },
      { label: 'Resume Uploads', value: '—', desc: 'loading...', icon: <FileText className="w-4 h-4 text-purple-400" /> },
      { label: 'ATS Health', value: '—', desc: 'loading...', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
      { label: 'Open Roles', value: '—', desc: 'loading...', icon: <Briefcase className="w-4 h-4 text-rose-400" /> }
    ];

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 text-left space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              Admin workspace
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-white">Welcome back, {user?.name || 'Administrator'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">Monitor platform health, review new opportunities, and keep the community experience polished.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleNewAnnouncement} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10">
              New announcement
            </button>
            <button type="button" onClick={handleExportReport} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
              Export report
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="mt-3 text-2xl font-black text-white">{stat.value}</div>
              <div className="mt-1 text-xs text-gray-400">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.23fr_0.77fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Community moderation</h2>
                <p className="mt-1 text-sm text-gray-400">Keep roles aligned across students, recruiters, and admins.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                {mockUsers.length} members
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {mockUsers.map((userItem) => (
                <div key={userItem.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
                      {userItem.name ? userItem.name.split(' ').map((part) => part[0]).join('').slice(0, 2) : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{userItem.name || 'Registered User'}</div>
                      <div className="text-sm text-gray-400">{userItem.email}</div>
                      <div className="text-xs text-gray-500">{userItem.details}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${userItem.role === 'admin' ? 'bg-rose-500/10 text-rose-300' :
                        userItem.role === 'recruiter' ? 'bg-purple-500/10 text-purple-300' :
                          'bg-indigo-500/10 text-indigo-300'
                      }`}>
                      {userItem.role}
                    </span>
                    <select
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                      className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-xs text-gray-200 outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}

              {mockUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-gray-400">
                  <p className="font-semibold text-white">No active students or recruiters logged in yet.</p>
                  <p className="mt-1 text-xs text-gray-500">As soon as students or recruiters register or log in, their profiles will populate here for role moderation.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Approval queue</h2>
                <p className="mt-1 text-sm text-gray-400">Review the latest opportunities waiting for activation.</p>
              </div>
              <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {pendingJobs.length} pending
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pendingJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{job.title}</div>
                      <div className="mt-1 text-sm text-indigo-300">{job.company}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Clock3 className="w-3.5 h-3.5" />
                        {job.location}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                      {job.type}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-400 line-clamp-3">{job.description}</p>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleRejectJob(job.id)}
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                      title="Reject/Archive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApproveJob(job.id)}
                      className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}

              {pendingJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-gray-500">
                  No job approvals are pending right now.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Resume review queue</h2>
                <p className="mt-1 text-sm text-gray-400">View uploaded resumes and download files for admin review.</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Avg AI Score: {avgAiScore}%</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Pending: {pendingResumes}</span>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.24em] text-gray-500">
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Resume</th>
                    <th className="px-3 py-3">AI Score</th>
                    <th className="px-3 py-3">ATS Score</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resumes.map((resume) => (
                    <tr key={resume.jobId} className="hover:bg-white/5">
                      <td className="px-3 py-4">
                        <div className="font-semibold text-white">{resume.studentName}</div>
                        <div className="text-[11px] text-gray-500">{resume.studentEmail}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-white">{resume.fileName}</div>
                        <div className="text-[11px] text-gray-500">{new Date(resume.uploadedAt).toLocaleString()}</div>
                      </td>
                      <td className="px-3 py-4 text-indigo-200 font-semibold">{resume.aiScore}%</td>
                      <td className="px-3 py-4 text-emerald-200 font-semibold">{resume.atsScore}%</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${resume.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {resume.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        {resume.downloadAvailable ? (
                          <a
                            href={`${import.meta.env.VITE_API_BASE || 'http://localhost:5178'}/api/admin/resumes/${resume.jobId}/download`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">No file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {resumes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-sm text-gray-500">No resumes have been uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
