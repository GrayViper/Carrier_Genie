import { describe, it, expect, beforeEach } from 'vitest';
import { getDeadlineInsight, getNextSteps, toggleSavedJob, isJobSaved, getSavedJobs } from './studentJourney.js';

describe('student journey helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('flags urgent deadlines correctly', () => {
    const target = new Date();
    target.setDate(target.getDate() + 2);
    const insight = getDeadlineInsight(target.toISOString());
    expect(insight.urgent).toBe(true);
    expect(insight.label).toContain('day');
  });

  it('builds a checklist with completed and pending tasks', () => {
    const steps = getNextSteps({ resumeUploaded: true, skills: ['React'], applications: [], savedJobsCount: 1, notificationCount: 0 });
    expect(steps[0].completed).toBe(true);
    expect(steps[1].completed).toBe(true);
    expect(steps.find((step) => step.id === 'saved-jobs').completed).toBe(true);
  });

  it('persists bookmarked jobs in local storage', () => {
    toggleSavedJob('job_123');
    expect(isJobSaved('job_123')).toBe(true);
    expect(getSavedJobs()).toContain('job_123');

    toggleSavedJob('job_123');
    expect(isJobSaved('job_123')).toBe(false);
  });
});
