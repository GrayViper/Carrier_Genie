const STORAGE_KEY = 'cg_saved_jobs';

export const getDeadlineInsight = (deadline) => {
  if (!deadline) return { urgent: false, label: 'No deadline provided', daysLeft: null };

  const now = new Date();
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) {
    return { urgent: false, label: 'Deadline to confirm', daysLeft: null };
  }

  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return { urgent: true, label: `Apply within ${diffDays} day${diffDays === 1 ? '' : 's'}`, daysLeft: diffDays };
  }

  if (diffDays <= 10) {
    return { urgent: false, label: `${diffDays} days to go`, daysLeft: diffDays };
  }

  return { urgent: false, label: `${diffDays} days remaining`, daysLeft: diffDays };
};

export const getNextSteps = ({ resumeUploaded, skills = [], applications = [], savedJobsCount = 0, notificationCount = 0 }) => {
  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const hasApplications = Array.isArray(applications) && applications.length > 0;
  const hasSavedJobs = savedJobsCount > 0;

  return [
    {
      id: 'resume',
      title: 'Strengthen your resume',
      detail: resumeUploaded ? 'Your resume is already uploaded and ready for review.' : 'Upload a resume to unlock AI feedback and stronger matches.',
      completed: !!resumeUploaded
    },
    {
      id: 'skills',
      title: 'Add one more skill',
      detail: hasSkills ? 'Your profile already includes skills that improve your match quality.' : 'Add a few core skills to raise your alignment scores.',
      completed: hasSkills
    },
    {
      id: 'saved-jobs',
      title: 'Save a promising role',
      detail: hasSavedJobs ? 'You have bookmarked roles to revisit later.' : 'Save a few roles you want to come back to.',
      completed: hasSavedJobs
    },
    {
      id: 'applications',
      title: 'Apply to your top match',
      detail: hasApplications ? 'Your applications are moving through the review pipeline.' : 'Submit one application to start the process.',
      completed: hasApplications
    },
    {
      id: 'alerts',
      title: 'Keep an eye on updates',
      detail: notificationCount > 0 ? 'New updates are ready for you.' : 'We will surface recruiter and approval updates here.',
      completed: notificationCount > 0
    }
  ];
};

export const getSavedJobs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const toggleSavedJob = (jobId) => {
  const current = getSavedJobs();
  const next = current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId];
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
};

export const isJobSaved = (jobId) => getSavedJobs().includes(jobId);
