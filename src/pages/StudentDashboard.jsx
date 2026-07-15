import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useJobs } from '../context/useJobs';
import { useApplications } from '../context/useApplications';
import {
	FileText,
	Briefcase,
	ArrowUpRight,
	Plus,
	Trash2,
	Edit2,
	Sparkles,
	Target,
	TrendingUp,
	Clock3,
	CheckCircle2
} from 'lucide-react';
import { getNextSteps, getSavedJobs } from '../utils/studentJourney';
import { hasStoredResume } from '../utils/resumeStorage';

export default function StudentDashboard() {
	const { user, updateUserProfile } = useAuth();
	const { jobs, calculateMatchScore } = useJobs();
	const { applications } = useApplications();
	const navigate = useNavigate();

	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [editedMajor, setEditedMajor] = useState(user?.major || 'Computer Science');
	const [editedGradYear, setEditedGradYear] = useState(user?.graduationYear || 2026);
	const [editedEmail, setEditedEmail] = useState(user?.email || '');
	const [editedCollege, setEditedCollege] = useState(user?.college || '');
	const [newSkill, setNewSkill] = useState('');
	const [newMajor, setNewMajor] = useState('');
	const [newGradYear, setNewGradYear] = useState('');
	const [newEmail, setNewEmail] = useState('');
	const [newCollege, setNewCollege] = useState('');

	if (!user || user.role !== 'student') {
		return (
			<div className="py-20 text-center">
				<h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
				<p className="text-gray-400 mb-6">Please log in as a student to access this dashboard.</p>
				<button onClick={() => navigate('/login')} className="rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white">
					Go to Login
				</button>
			</div>
		);
	}

	const studentApps = applications.filter((app) => app.studentId === user.id);
	const hasResume = Boolean(hasStoredResume(user.id) || user.resumeUploaded);

	const allActiveJobs = jobs.filter((job) => job.status === 'active');
	const matchedJobs = hasResume
		? allActiveJobs
				.map((job) => ({
					...job,
					matchScore: calculateMatchScore(job.skills, user.skills)
				}))
				.sort((a, b) => b.matchScore - a.matchScore)
				.slice(0, 3)
		: allActiveJobs.filter((job) => job.type?.toLowerCase().includes('intern')).slice(0, 3);

	const profileStrength = (!user.skills || user.skills.length === 0)
		? 0
		: Math.min(100, (hasResume ? 38 : 0) + (user.skills?.length ? 24 : 0) + (studentApps.length ? 18 : 0) + 20);
	const resumeScore = hasResume ? (user.resumeScore || 78) : null;
	const savedJobsCount = getSavedJobs().length;
	const nextSteps = getNextSteps({ resumeUploaded: hasResume, skills: user.skills || [], applications: studentApps, savedJobsCount, notificationCount: 0 });
	const nextStepActions = {
		resume: () => navigate('/resume'),
		skills: () => setIsEditingProfile(true),
		'saved-jobs': () => navigate('/jobs'),
		applications: () => navigate('/applications'),
		alerts: () => navigate('/dashboard/student')
	};

	const handleAddMajor = (e) => {
		e.preventDefault();
		const trimmed = newMajor.trim();
		if (!trimmed) return;
		updateUserProfile({ major: trimmed });
		setNewMajor('');
	};

	const handleRemoveMajor = () => {
		updateUserProfile({ major: '' });
	};

	const handleAddGradYear = (e) => {
		e.preventDefault();
		const year = parseInt(newGradYear, 10);
		if (!year || Number.isNaN(year)) return;
		updateUserProfile({ graduationYear: year });
		setNewGradYear('');
	};

	const handleAddEmail = (e) => {
		e.preventDefault();
		const trimmed = newEmail.trim();
		if (!trimmed) return;
		updateUserProfile({ email: trimmed });
		setNewEmail('');
	};

	const handleRemoveEmail = () => {
		updateUserProfile({ email: '' });
	};

	const handleAddCollege = (e) => {
		e.preventDefault();
		const trimmed = newCollege.trim();
		if (!trimmed) return;
		updateUserProfile({ college: trimmed });
		setNewCollege('');
	};

	const handleRemoveCollege = () => {
		updateUserProfile({ college: '' });
	};

	const handleRemoveGradYear = () => {
		updateUserProfile({ graduationYear: null });
	};

	const handleSaveProfile = (e) => {
		e.preventDefault();
		updateUserProfile({
			major: editedMajor,
			graduationYear: parseInt(editedGradYear, 10),
			email: editedEmail,
			college: editedCollege
		});
		setIsEditingProfile(false);
	};

	const handleAddSkill = (e) => {
		e.preventDefault();
		const trimmed = newSkill.trim();
		if (!trimmed) return;
		const currentSkills = Array.isArray(user.skills) ? user.skills : [];
		const exists = currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
		if (!exists) {
			updateUserProfile({ skills: [...currentSkills, trimmed] });
			setNewSkill('');
		}
	};

	const handleRemoveSkill = (skillToRemove) => {
		const currentSkills = Array.isArray(user.skills) ? user.skills : [];
		updateUserProfile({ skills: currentSkills.filter((s) => s !== skillToRemove) });
	};

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.3)] md:p-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
							<Sparkles className="h-3.5 w-3.5" />
							Student workspace
						</div>
						<h1 className="mt-3 text-3xl font-display font-black text-white">Welcome back, {user.name}.</h1>
						<p className="mt-2 max-w-2xl text-sm text-gray-400">Your opportunities are ready. Review your fit, improve your profile, and stay on top of every application.</p>
					</div>

					<div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
						{[
							{ label: 'Profile strength', value: `${profileStrength}%`, desc: 'Resume + skills + activity', icon: <Target className="h-4 w-4 text-indigo-400" /> },
							{ label: 'Top match', value: `${matchedJobs[0]?.matchScore || 0}%`, desc: 'Best fit opportunity', icon: <TrendingUp className="h-4 w-4 text-cyan-400" /> },
							{ label: 'Applications', value: studentApps.length, desc: 'In progress or pending', icon: <Briefcase className="h-4 w-4 text-purple-400" /> },
							...(hasResume ? [{ label: 'Resume score', value: `${resumeScore}%`, desc: 'Current readiness snapshot', icon: <FileText className="h-4 w-4 text-emerald-400" /> }] : [])
						].map((stat, index) => (
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
			</div>

			<div className="mt-6 grid grid-cols-1 gap-6">
				<div className="space-y-6">
					<div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-xl font-display font-bold text-white">Your profile snapshot</h2>
								<p className="mt-1 text-sm text-gray-400">Keep your details polished so the platform can match you better.</p>
							</div>
							<button onClick={() => setIsEditingProfile(!isEditingProfile)} className="rounded-full border border-white/10 bg-white/5 p-2 text-indigo-300 transition hover:bg-white/10">
								<Edit2 className="h-4 w-4" />
							</button>
						</div>

						<div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4">
							<div className="grid grid-cols-1 gap-4 mb-4">
								<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
									<div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Degree & major</div>
									{isEditingProfile ? (
										<>
											<input type="text" value={editedMajor} onChange={(e) => setEditedMajor(e.target.value)} placeholder="Example: Computer Science" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none mt-2" />
											<input type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} placeholder="example@university.edu" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none mt-2" />
										</>
									) : (
										<>
											{user.major ? (
												<div className="mt-2 flex items-center gap-3">
													<div className="text-sm font-semibold text-white">{user.major}</div>
													<button type="button" onClick={handleRemoveMajor} className="text-gray-500 hover:text-rose-400">
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											) : (
												<form onSubmit={handleAddMajor} className="mt-2 flex items-center gap-2">
													<input placeholder="Add degree/major" value={newMajor} onChange={(e) => setNewMajor(e.target.value)} className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none" />
													<button type="submit" className="rounded-full bg-indigo-600 p-2 text-white">
														<Plus className="h-3.5 w-3.5" />
													</button>
												</form>
											)}
											<div className="mt-3 text-xs text-gray-400">
												{user.email ? (
													<div className="flex items-center gap-2">
														<span>{user.email}</span>
														<button type="button" onClick={handleRemoveEmail} className="text-gray-500 hover:text-rose-400">
															<Trash2 className="h-3 w-3" />
														</button>
													</div>
												) : (
													<form onSubmit={handleAddEmail} className="flex items-center gap-2">
														<input placeholder="Add email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none" />
														<button type="submit" className="rounded-full bg-indigo-600 p-2 text-white">
															<Plus className="h-3.5 w-3.5" />
														</button>
													</form>
												)}
											</div>
										</>
									)}
								</div>

								<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
									<div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">Expected graduation</div>
									{isEditingProfile ? (
										<>
											<input type="number" value={editedGradYear} onChange={(e) => setEditedGradYear(e.target.value)} placeholder="Example: 2026" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none mt-2" />
											<input type="text" value={editedCollege} onChange={(e) => setEditedCollege(e.target.value)} placeholder="Example: State University" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none mt-2" />
										</>
									) : (
										<>
											{user.graduationYear ? (
												<div className="mt-2 flex items-center gap-3">
													<div className="text-sm font-semibold text-white">Class of {user.graduationYear}</div>
													<button type="button" onClick={handleRemoveGradYear} className="text-gray-500 hover:text-rose-400">
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											) : (
												<form onSubmit={handleAddGradYear} className="mt-2 flex items-center gap-2">
													<input placeholder="Add graduation year" value={newGradYear} onChange={(e) => setNewGradYear(e.target.value)} className="w-28 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none" />
													<button type="submit" className="rounded-full bg-indigo-600 p-2 text-white">
														<Plus className="h-3.5 w-3.5" />
													</button>
												</form>
											)}
											<div className="mt-3 text-xs text-gray-400">
												{user.college ? (
													<div className="flex items-center gap-2">
														<span>{user.college}</span>
														<button type="button" onClick={handleRemoveCollege} className="text-gray-500 hover:text-rose-400">
															<Trash2 className="h-3 w-3" />
														</button>
													</div>
												) : (
													<form onSubmit={handleAddCollege} className="flex items-center gap-2">
														<input placeholder="Add university" value={newCollege} onChange={(e) => setNewCollege(e.target.value)} className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none" />
														<button type="submit" className="rounded-full bg-indigo-600 p-2 text-white">
															<Plus className="h-3.5 w-3.5" />
														</button>
													</form>
												)}
											</div>
										</>
									)}
								</div>
							</div>

							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-white">Skills & keywords</h3>
								<span className="text-xs text-gray-500">{user.skills?.length || 0} tracked</span>
							</div>

							<div className="mt-4 flex flex-wrap gap-2">

								{user.skills?.map((skill) => (
									<span key={skill} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-2.5 py-1 text-xs text-gray-300">
										{skill}
										<button type="button" onClick={() => handleRemoveSkill(skill)} className="text-gray-500 transition hover:text-rose-400">
											<Trash2 className="h-3 w-3" />
										</button>
									</span>
								))}

								{(!user.skills || user.skills.length === 0) && <span className="text-sm text-gray-500">No skills added yet.</span>}
							</div>

							<form onSubmit={handleAddSkill} className="mt-4 flex gap-2">
								<input type="text" placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="flex-1 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none" />
								<button type="submit" className="rounded-full bg-indigo-600 p-2 text-white">
									<Plus className="h-4 w-4" />
								</button>
							</form>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-display font-bold text-white">Best-fit opportunities</h2>
								<p className="mt-1 text-sm text-gray-400">Highly aligned options selected for your profile.</p>
							</div>
							<Link to="/jobs" className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-200">View all</Link>
						</div>

						<div className="mt-5 grid gap-3 md:grid-cols-3">
							{matchedJobs.map((job) => (
								<div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="flex items-start justify-between">
										<span className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black text-white ${job.logoBg}`}>{job.logo}</span>
										{hasResume ? (
											<span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${job.matchScore >= 80 ? 'bg-indigo-500/10 text-indigo-300' : job.matchScore >= 60 ? 'bg-purple-500/10 text-purple-300' : 'bg-cyan-500/10 text-cyan-300'}`}>{job.matchScore}%</span>
										) : (
											<span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-300">Internship</span>
										)}
									</div>

									<div className="mt-3">
										<div className="text-sm font-semibold text-white">{job.title}</div>
										<div className="mt-1 text-xs text-gray-400">{job.company}</div>
									</div>

									<Link to={`/jobs/${job.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">
										See details
										<ArrowUpRight className="h-3.5 w-3.5" />
									</Link>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-display font-bold text-white">Application tracker</h2>
								<p className="mt-1 text-sm text-gray-400">Stay aware of where each application stands.</p>
							</div>
							<Link to="/applications" className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-200">Open tracker</Link>
						</div>

						{studentApps.length > 0 ? (
							<div className="mt-5 space-y-4">
								{studentApps.map((app) => {
									const getStageInfo = (status) => {
										const stages = { 'Applied': { num: 1, total: 4, desc: 'Waiting for review' }, 'Review': { num: 2, total: 4, desc: 'Being evaluated' }, 'Interview': { num: 3, total: 4, desc: 'Interview scheduled' }, 'Offer': { num: 4, total: 4, desc: '✨ Offer received!' }, 'Rejected': { num: 4, total: 4, desc: '❌ Not selected this time' } };
										return stages[status] || { num: 1, total: 4, desc: 'Pending' };
									};
									const stage = getStageInfo(app.status);
									return (
										<div key={app.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-3">
													<div className={`flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-black text-white ${app.logoBg}`}>{app.logo}</div>
													<div>
														<div className="text-sm font-semibold text-white">{app.jobTitle}</div>
														<div className="text-xs text-gray-400">{app.company}</div>
													</div>
												</div>
												<span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${app.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-300' : app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-300' : app.status === 'Interview' ? 'bg-purple-500/10 text-purple-300' : app.status === 'Review' ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'}`}>{app.status}</span>
											</div>

											<div className="space-y-2">
												<div className="flex items-center justify-between text-[10px]">
													<span className="text-gray-500">Progress: {stage.desc}</span>
													<span className="text-gray-400 font-semibold">{stage.num}/{stage.total}</span>
												</div>
												<div className="h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
													<div 
														className={`h-full rounded-full transition-all ${
															app.status === 'Offer' ? 'bg-emerald-500' : 
															app.status === 'Rejected' ? 'bg-rose-500' : 
															app.status === 'Interview' ? 'bg-purple-500' : 
															app.status === 'Review' ? 'bg-amber-500' : 
															'bg-cyan-500'
														}`}
														style={{ width: `${(stage.num / stage.total) * 100}%` }}
													></div>
												</div>
											</div>

											<div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400 border-t border-white/5 pt-2">
												<span>Applied: {app.date}</span>
												{app.matchScore && <span className="text-indigo-300 font-semibold">{app.matchScore}% match</span>}
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-gray-500">You have not applied to any roles yet. Start exploring opportunities to build momentum.</div>
						)}
					</div>

					<div className="rounded-[24px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-slate-950/80 to-cyan-400/10 p-6">
						<div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
							<Clock3 className="h-4 w-4" />
							Suggested next step
						</div>

						<div className="mt-4 space-y-3">
							{nextSteps.map((step) => (
								<button key={step.id} type="button" onClick={() => nextStepActions[step.id]?.()} className="group w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-indigo-500/30 hover:bg-indigo-500/10">
									<div className="flex items-start gap-3">
										<div className={`mt-0.5 rounded-full p-1 ${step.completed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/10 text-gray-400'}`}><CheckCircle2 className="h-3.5 w-3.5" /></div>
										<div>
											<div className="text-sm font-semibold text-white">{step.title}</div>
											<div className="text-xs text-gray-400">{step.detail}</div>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


