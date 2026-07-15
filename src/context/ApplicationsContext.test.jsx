import React, { useContext } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { buildStatusChangeNotification, ApplicationsProvider } from './ApplicationsContext';
import { ApplicationsContext } from './ApplicationsContextValue';

let mockUser = { id: 'usr_student', role: 'student' };

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    getAuthToken: vi.fn().mockResolvedValue('token'),
    user: mockUser
  })
}));

describe('buildStatusChangeNotification', () => {
  it('creates a student-facing notification for recruiter status changes', () => {
    const application = {
      id: 'app_1',
      studentId: 'usr_student',
      studentName: 'Olivia Chen',
      jobTitle: 'Frontend Intern',
      company: 'Stripe',
      status: 'Applied'
    };

    const notification = buildStatusChangeNotification(application, 'Interview', 'Technical review scheduled.');

    expect(notification.recipientId).toBe('usr_student');
    expect(notification.type).toBe('application_status_update');
    expect(notification.message).toContain('interview');
    expect(notification.subject).toContain('Frontend Intern');
  });
});

describe('ApplicationsProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ applications: [] })
    });
  });

  it('clears stale shared applications when the server reports no applications for the current user', async () => {
    localStorage.setItem('cg_applications', JSON.stringify([{ id: 'ghost_app', studentId: 'other_user', jobTitle: 'Ghost role' }]));
    localStorage.setItem('cg_applications:usr_student', JSON.stringify([{ id: 'real_app', studentId: 'usr_student', jobTitle: 'Real role' }]));

    mockUser = null;

    let contextValue;
    const Consumer = () => {
      contextValue = useContext(ApplicationsContext);
      return null;
    };

    const { rerender } = render(
      <ApplicationsProvider>
        <Consumer />
      </ApplicationsProvider>
    );

    mockUser = { id: 'usr_student', role: 'student' };
    rerender(
      <ApplicationsProvider>
        <Consumer />
      </ApplicationsProvider>
    );

    await waitFor(() => {
      expect(contextValue?.applications).toEqual([]);
    });
  });
});
