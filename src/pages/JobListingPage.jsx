import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '../context/useJobs';
import { useAuth } from '../context/useAuth';
import { useApplications } from '../context/useApplications';
import { Search, MapPin, DollarSign, Calendar, ChevronRight, Sparkles, Briefcase, TrendingUp, Bookmark, BookmarkCheck } from 'lucide-react';
import { getDeadlineInsight, getSavedJobs, toggleSavedJob } from '../utils/studentJourney';

export default function JobListingPage() {
  const { jobs, calculateMatchScore } = useJobs();
  const { user } = useAuth();
  const { applications } = useApplications();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleType, setRoleType] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [matchScoreMin, setMatchScoreMin] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState(() => getSavedJobs());

  const activeJobs = jobs.filter((job) => job.status === 'active');
  const userSkills = user?.role === 'student' ? user.skills : [];

  const filteredJobs = activeJobs
    .map((job) => ({
      ...job,
      matchScore: calculateMatchScore(job.skills, userSkills)
    }))
    .filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = roleType === 'All' || job.type === roleType;
      const matchesSkill = skillFilter === 'All' || job.skills.some((s) => s.toLowerCase() === skillFilter.toLowerCase());
      const matchesMatchScore = job.matchScore >= matchScoreMin;

      return matchesSearch && matchesType && matchesSkill && matchesMatchScore;
    });

  const studentApps = applications.filter((app) => app.studentId === user?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
              <Briefcase className="w-3.5 h-3.5" />
              Opportunity hub
            </div>
            <h1 className="mt-3 text-3xl font-display font-black text-white">Discover roles that fit your profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Browse current openings with a cleaner experience, stronger relevance signals, and faster next steps.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
            <div className="flex items-center gap-2 text-indigo-300">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">{filteredJobs.length} active opportunities</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">Updated for your current interests</div>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="relative text-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by title, company, or keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-indigo-500"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Role type</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-sm text-white outline-none"
              >
                <option value="All">All types</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Core skill</label>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-sm text-white outline-none"
              >
                <option value="All">All skills</option>
                <option value="React">React</option>
                <option value="Python">Python</option>
                <option value="Figma">Figma</option>
                <option value="Node.js">Node.js</option>
              </select>
            </div>

            {user?.role === 'student' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Match threshold</label>
                <select
                  value={matchScoreMin}
                  onChange={(e) => setMatchScoreMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-sm text-white outline-none"
                >
                  <option value="0">Show all matches</option>
                  <option value="50">50% + match</option>
                  <option value="70">70% + match</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
        <span>Showing {filteredJobs.length} tailored opportunities</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
          {studentApps.length} applications in progress
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => {
          const isApplied = studentApps.some((app) => app.jobId === job.id);
          const appliedStatus = studentApps.find((app) => app.jobId === job.id)?.status;

          const deadlineInsight = getDeadlineInsight(job.deadline);
          const saved = savedJobIds.includes(job.id);

          return (
            <div
              key={job.id}
              className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5 transition hover:border-indigo-400/20 hover:bg-slate-900/80"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl font-black text-white ${job.logoBg}`}>
                    {job.logo}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                        {job.type}
                      </span>
                      {isApplied && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                          Applied • {appliedStatus}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-indigo-300">{job.company}</p>

                    <p className="mt-2 text-sm text-gray-400">{job.description}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Deadline {job.deadline}
                      </span>
                    </div>

                    {deadlineInsight.urgent && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        {deadlineInsight.label}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-gray-400">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  {user?.role === 'student' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left lg:text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Match</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-xl font-black ${job.matchScore >= 80 ? 'text-indigo-400' : job.matchScore >= 60 ? 'text-purple-400' : 'text-cyan-400'}`}>
                          {job.matchScore}%
                        </span>
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {user?.role === 'student' && (
                      <button
                        type="button"
                        onClick={() => setSavedJobIds(toggleSavedJob(job.id))}
                        className={`rounded-full border p-2 transition ${saved ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
                        title={saved ? 'Remove bookmark' : 'Save job'}
                      >
                        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    )}
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      View details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-gray-500">
            No jobs match the current search and filters yet.
          </div>
        )}
      </div>
    </div>
  );
}
