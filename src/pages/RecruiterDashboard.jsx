import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useJobs } from '../context/useJobs';
import { useApplications } from '../context/useApplications';
import { Plus, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { jobs, addJob } = useJobs();
  const { applications, updateApplicationStatus } = useApplications();

  // Job creation form state
  const [showPostForm, setShowPostForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [jobLocation, setJobLocation] = useState('Remote');
  const [jobSalary, setJobSalary] = useState('$120k - $150k');
  const [jobDeadline, setJobDeadline] = useState('Aug 30, 2026');
  const [jobSkills, setJobSkills] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [notification, setNotification] = useState('');

  // Selected applicant details state for showing their parsed resume review
  const [expandedAppId, setExpandedAppId] = useState(null);

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Please log in as a recruiter to access this dashboard.</p>
      </div>
    );
  }

  // Get jobs posted by this recruiter's company
  const recruiterJobs = jobs.filter(job => job.company === user.company);

  // Get applications submitted for these jobs
  const jobIds = recruiterJobs.map(j => j.id);
  const recruiterApps = applications.filter(app => jobIds.includes(app.jobId));

  const handlePostJob = (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobSkills.trim() || !jobDesc.trim()) {
      alert('Please fill out required fields.');
      return;
    }

    const skillsArray = jobSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const reqsArray = jobReqs.split(',').map(r => r.trim()).filter(r => r.length > 0);

    addJob({
      title: jobTitle,
      company: user.company,
      logo: user.companyLogo || user.company[0],
      location: jobLocation,
      type: jobType,
      skills: skillsArray,
      description: jobDesc,
      requirements: reqsArray.length > 0 ? reqsArray : ['Familiarity with related tech stack.'],
      salary: jobSalary,
      deadline: jobDeadline,
      status: 'pending_approval' // Needs Admin approval
    });


    setNotification('Job listing posted successfully! It is now pending administrator approval.');
    setShowPostForm(false);
    
    // Reset form
    setJobTitle('');
    setJobType('Full-time');
    setJobLocation('Remote');
    setJobSalary('$120k - $150k');
    setJobDeadline('Aug 30, 2026');
    setJobSkills('');
    setJobDesc('');
    setJobReqs('');

    setTimeout(() => setNotification(''), 6000);
  };

  const handleUpdateStatus = (appId, newStatus) => {
    let comment = '';
    if (newStatus === 'Interview') comment = 'Technical review and team interview scheduled by recruiter.';
    else if (newStatus === 'Offer') comment = 'Mock offer extended. Please check email for details.';
    else if (newStatus === 'Rejected') comment = 'Application reviewed. Thank you for your interest.';
    
    updateApplicationStatus(appId, newStatus, comment);
  };

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 text-left space-y-8">
      {/* Welcome & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-display font-black text-white">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-400">Manage placement listings and review AI candidate matches for <strong className="text-indigo-400">{user.company}</strong>.</p>
        </div>
        <button
          onClick={() => setShowPostForm(!showPostForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Internship or Job</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-4 rounded-xl font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Post Job Form (Collapsible Modal/Drawer representation) */}
      {showPostForm && (
        <div className="glass-panel-card p-6 rounded-2xl border border-indigo-500/20 bg-slate-950/80 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-lg font-display font-bold text-white">Post a New Opportunity</h3>
            <button onClick={() => setShowPostForm(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Job Title *</label>
              <input 
                type="text" required placeholder="e.g. Software Engineer" 
                value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Role Type</label>
              <select 
                value={jobType} onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Full-time">Full-time Job</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Location</label>
              <input 
                type="text" placeholder="e.g. San Francisco, CA or Remote" 
                value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Salary Range</label>
              <input 
                type="text" placeholder="e.g. $120k - $150k or $50/hr" 
                value={jobSalary} onChange={(e) => setJobSalary(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Deadline</label>
              <input 
                type="text" placeholder="e.g. Aug 30, 2026" 
                value={jobDeadline} onChange={(e) => setJobDeadline(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Required Skills (Comma separated) *</label>
              <input 
                type="text" required placeholder="e.g. React, Node.js, Git, SQL" 
                value={jobSkills} onChange={(e) => setJobSkills(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Description *</label>
              <textarea 
                required rows="3" placeholder="Provide a summary of the role..."
                value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-gray-400 uppercase tracking-wider block">Requirements List (Comma separated)</label>
              <input 
                type="text" placeholder="e.g. BS in CS, 2 years programming, strong problem-solving" 
                value={jobReqs} onChange={(e) => setJobReqs(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button 
                type="button" onClick={() => setShowPostForm(false)} 
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Submit Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Recruiter Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Posted Jobs and Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Active Postings ({recruiterJobs.length})</h3>
            <div className="flex flex-col gap-3">
              {recruiterJobs.map((job) => (
                <div key={job.id} className="p-3 bg-white/2 border border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-white">{job.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                      job.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {job.status === 'active' ? 'Active' : 'Pending Admin'}
                    </span>
                  </div>
                  <div className="text-gray-400 space-y-1">
                    <p>{job.type} • {job.location}</p>
                    <p className="font-mono text-[9px]">Skills: {job.skills.join(', ')}</p>
                  </div>
                </div>
              ))}
              {recruiterJobs.length === 0 && (
                <p className="text-xs text-gray-500 italic">No job postings listed yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Applicants & AI Matching Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Submitted Candidates ({recruiterApps.length})</h3>
            
            <div className="flex flex-col gap-4">
              {recruiterApps.map((app) => {
                const isExpanded = expandedAppId === app.id;
                return (
                  <div 
                    key={app.id}
                    className={`border rounded-xl transition ${
                      isExpanded ? 'border-indigo-500/30 bg-indigo-950/5' : 'border-white/5 hover:border-white/10 bg-white/1'
                    }`}
                  >
                    {/* Basic details banner */}
                    <div 
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{app.studentName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            app.matchScore >= 80 ? 'bg-indigo-500/10 text-indigo-400' :
                            app.matchScore >= 60 ? 'bg-purple-500/10 text-purple-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {app.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-gray-400">Applied for <strong className="text-white">{app.jobTitle}</strong> • {app.date}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                            app.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-400' :
                            app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                            app.status === 'Interview' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>

                    {/* Expandable parsed resume analysis area */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5 space-y-2">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Candidate Strengths</span>
                            <ul className="list-disc pl-4 space-y-1 text-gray-300">
                              <li>Highly matching technical profile keywords.</li>
                              <li>Proven academic achievements and project foundations.</li>
                              <li>Good alignment with required team structure.</li>
                            </ul>
                          </div>

                          {/* Action Items */}
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5 space-y-2">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Candidate Skills</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {app.studentSkills.map(skill => (
                                <span key={skill} className="bg-white/5 border border-white/5 rounded-full px-2 py-0.5 text-[10px] text-gray-300">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Status controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                          <span className="text-gray-400">Update Application Funnel:</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'Interview')}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px]"
                            >
                              Schedule Interview
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'Offer')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px]"
                            >
                              Extend Offer
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-semibold px-3 py-1.5 rounded-lg border border-rose-500/20 text-[10px]"
                            >
                              Reject Candidate
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}

              {recruiterApps.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic text-xs">
                  No applications received yet for your listed roles.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
