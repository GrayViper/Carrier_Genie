import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockUpdateApplicationStatus = vi.fn();

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'usr_recruiter', name: 'David Miller', role: 'recruiter', company: 'Stripe' },
    getAuthToken: async () => null,
    fetchProfile: async () => null
  })
}));

vi.mock('../context/useApplications', () => ({
  useApplications: () => ({
    applications: [
      {
        id: 'app_1',
        studentId: 'usr_student',
        studentName: 'Olivia Chen',
        jobId: 'job_1',
        jobTitle: 'Frontend Intern',
        company: 'Stripe',
        matchScore: 88,
        status: 'Applied',
        date: 'Jul 15, 2026',
        history: [{ status: 'Applied', date: 'Jul 15, 2026', comment: 'Application submitted.' }]
      }
    ],
    updateApplicationStatus: mockUpdateApplicationStatus
  })
}));

vi.mock('../context/useJobs', () => ({
  useJobs: () => ({ jobs: [{ id: 'job_1', title: 'Frontend Intern', company: 'Stripe' }] })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

import ApplicationTracker from './ApplicationTracker';

describe('ApplicationTracker recruiter view', () => {
  beforeEach(() => {
    mockUpdateApplicationStatus.mockReset();
  });

  it('shows recruiter progression controls for company applications', () => {
    render(
      <MemoryRouter>
        <ApplicationTracker />
      </MemoryRouter>
    );

    expect(screen.getByText(/Application Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Interview/i)).toBeInTheDocument();
    expect(screen.getByText(/Extend Offer/i)).toBeInTheDocument();
    expect(screen.getByText(/Reject Candidate/i)).toBeInTheDocument();
  });
});
