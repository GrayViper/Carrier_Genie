import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock contexts used by RecruiterDashboard
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'usr_recruiter', name: 'David Miller', role: 'recruiter' } })
}));

vi.mock('../context/useJobs', () => ({
  useJobs: () => ({ jobs: [], addJob: () => {}, fetchJobs: () => {} })
}));

vi.mock('../context/useApplications', () => ({
  useApplications: () => ({ applications: [] })
}));

import { MemoryRouter } from 'react-router-dom';
import RecruiterDashboard from './RecruiterDashboard';

describe('RecruiterDashboard', () => {
  it('renders basic heading for recruiter', () => {
    render(
      <MemoryRouter>
        <RecruiterDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Recruiter workspace/i)).toBeInTheDocument();
  });
});
