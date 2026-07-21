import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { JobsProvider } from '../context/JobsContext';
import { ApplicationsProvider } from '../context/ApplicationsContext';

const mockRecruiter = {
    id: 'usr_recruiter_test_flow',
    name: 'Test Recruiter',
    email: 'test-recruiter@company.com',
    role: 'recruiter',
    company: 'TestCo',
};

const mockAdmin = {
    id: 'usr_admin',
    name: 'Alex Mercer',
    email: 'admin@careergenie.com',
    role: 'admin',
};

const AllProviders = ({ children }) => (
    <AuthProvider>
        <JobsProvider>
            <ApplicationsProvider>{children}</ApplicationsProvider>
        </JobsProvider>
    </AuthProvider>
);

describe('Acceptance Test: Admin Job Approval Flow', () => {
    it('allows an admin to approve a job posted by a recruiter', async () => {
        const jobTitle = `Test Approval Engineer - ${Date.now()}`;

        // --- Step 1: Recruiter posts a job ---
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'cg_user') return JSON.stringify(mockRecruiter);
            if (key === 'cg_token') return 'mock-recruiter-token';
            return null;
        });

        render(<App />);

        // --- Step 2: Admin logs in and approves the job ---
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'cg_user') return JSON.stringify(mockAdmin);
            if (key === 'cg_token') return 'mock-admin-token';
            return null;
        });

        render(<App />);

        // Find the job in the approval queue
        const jobCard = await screen.findByText(jobTitle);
        const approveButton = await screen.findByRole('button', { name: /approve/i });

        // Click approve and wait for the UI to update
        await userEvent.click(approveButton);
        await waitFor(() => {
            expect(screen.queryByText(jobTitle)).not.toBeInTheDocument();
        });
    });
});