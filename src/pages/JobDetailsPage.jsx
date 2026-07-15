import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJobs } from '../context/useJobs';
import { useAuth } from '../context/useAuth';
import { useApplications } from '../context/useApplications';
import { 
  ArrowLeft, MapPin, DollarSign, Sparkles, 
  CheckCircle, ArrowRight, Loader2, Bookmark, BookmarkCheck 
} from 'lucide-react';
import { getDeadlineInsight, getSavedJobs, toggleSavedJob } from '../utils/studentJourney';
import { hasStoredResume } from '../utils/resumeStorage';

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getJobById, calculateMatchScore } = useJobs();
  const { user, fetchProfile } = useAuth();
  const { applications, applyToJob } = useApplications();

  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedJobIds, setSavedJobIds] = useState(() => getSavedJobs());

  // Ensure user is available; if not but token exists, try to restore profile
  React.useEffect(() => {
    if (!user && localStorage.getItem('cg_token') && localStorage.getItem('cg_user')) {
      try {
        const saved = JSON.parse(localStorage.getItem('cg_user'));
        if (saved?.id) {
          fetchProfile(saved.id).catch(() => {
            // User restore failed, let handleApply redirect to login
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [user, fetchProfile]);

  const job = getJobById(id);

  if (!job) {
    return (
      <div className="py-20 text-center text-xs">
        <h2 className="text-xl font-bold text-white mb-2">Job Listing Not Found</h2>
        <p className="text-gray-400 mb-6">The listing you requested could not be resolved.</p>
        <Link to="/jobs" className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-semibold">
          Return to Listings
        </Link>
      </div>
    );
  }

  const currentUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('cg_user') || 'null');
    } catch {
      return null;
    }
  })();
  const userSkills = currentUser?.role === 'student' ? currentUser.skills : [];
  const matchScore = calculateMatchScore(job.skills, userSkills);
  const deadlineInsight = getDeadlineInsight(job.deadline);
  const saved = savedJobIds.includes(job.id);
  const hasResume = Boolean(hasStoredResume(currentUser?.id) || currentUser?.resumeUploaded);

  // Check if student is already applied
  const isApplied = applications.some(app => app.jobId === job.id && app.studentId === currentUser?.id);
  const appliedApp = applications.find(app => app.jobId === job.id && app.studentId === currentUser?.id);

  // Find matching and missing skills
  const matchedSkillsList = job.skills.filter(s => 
    userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
  );
  const missingSkillsList = job.skills.filter(s => !matchedSkillsList.includes(s));

  const handleApply = () => {
    // Restore user from localStorage if not in state but token exists
    let currentUser = user;
    if (!currentUser && localStorage.getItem('cg_token') && localStorage.getItem('cg_user')) {
      try {
        currentUser = JSON.parse(localStorage.getItem('cg_user'));
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check if user is authenticated
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'student') {
      alert('Only student profiles can apply for listings.');
      return;
    }

    if (!hasStoredResume(currentUser?.id) && !currentUser?.resumeUploaded) {
      setErrorMsg('Upload your resume before applying to jobs.');
      return;
    }

    setApplying(true);
    setErrorMsg('');

    // Simulate submission delay
    setTimeout(async () => {
      setApplying(false);
      const res = await applyToJob(job, currentUser, matchScore);
      if (res && res.success) {
        setApplySuccess(true);
      } else {
        setErrorMsg(res?.message || 'Something went wrong. Please try again.');
      }
    }, 1200);
  };

  return (
    <div className="py-10 px-4 max-w-5xl mx-auto sm:px-6 lg:px-8 text-left space-y-6">
      
      {/* Back button */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-card p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
            
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0 ${job.logoBg}`}>
                {job.logo}
              </div>
              <div className="space-y-1 text-xs text-left">
                <h1 className="text-2xl font-display font-black text-white leading-none mb-1">{job.title}</h1>
                <p className="text-sm text-indigo-400 font-semibold">{job.company}</p>
                <div className="flex flex-wrap items-center gap-4 text-gray-500 pt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{job.salary}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Role Overview</h3>
              <p className="text-gray-300 leading-relaxed text-sm">{job.description}</p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300">Deadline signal</div>
                  <div className="mt-1 font-semibold">{deadlineInsight.label}</div>
                </div>
                <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                  {deadlineInsight.urgent ? 'Urgent' : 'Watchlist'}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Requirements</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
              </ul>
            </div>

          </div>
        </div>

        {/* Sidebar compatibility card */}
        <div className="space-y-6">
          {/* AI Compatibility Panel */}
          {user?.role === 'student' && (
            <div className="glass-panel-card p-6 rounded-2xl border border-white/5 space-y-5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Compatibility</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>

              {/* Match Score Display */}
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-extrabold font-display text-gradient-purple">{matchScore}%</span>
                <span className="text-xs text-gray-500">Alignment Score</span>
              </div>

              {/* Skills matched list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Your Matching Skills ({matchedSkillsList.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkillsList.map(skill => (
                    <span key={skill} className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full px-2.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>{skill}</span>
                    </span>
                  ))}
                  {matchedSkillsList.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No matching skills detected.</span>
                  )}
                </div>
              </div>

              {/* Skill gap recommendations */}
              {missingSkillsList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Skills Gap Recommendation</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    Add the following skills to your profile and resume to reach 100% compatibility:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkillsList.map(skill => (
                      <span key={skill} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 text-[10px]">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Callouts */}
          <div className="glass-panel-card p-6 rounded-2xl border border-white/5 text-xs space-y-4">
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            {isApplied ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Applied - {appliedApp?.status}</span>
                </div>
                <p className="text-gray-400 text-center text-[10px]">
                  Submitted on {appliedApp?.date}. Check the <Link to="/applications" className="text-indigo-400 hover:underline">Application Tracker</Link> for logs.
                </p>
              </div>
            ) : applySuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl font-semibold text-center space-y-2">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs">Application Submitted!</p>
                <p className="text-[10px] text-gray-400">Your profile matches have been registered in the recruiter queue.</p>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSavedJobIds(toggleSavedJob(job.id))}
                  className={`p-3.5 rounded-xl border transition-colors ${saved ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                  title={saved ? 'Remove bookmark' : 'Bookmark role'}
                >
                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying || !hasResume}
                  className={`flex-grow font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${hasResume ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/10' : 'bg-slate-800 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>{hasResume ? 'Apply Now' : 'Upload Resume to Apply'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
            
            <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1.5">
              <span>Deadline: {job.deadline}</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">Report listing</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
