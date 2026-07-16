import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ 
    user: { id: 'usr_student', name: 'Olivia Chen', role: 'student' }, 
    updateUserProfile: () => {},
    saveProfile: () => Promise.resolve({ id: 'usr_student' }),
    getAuthToken: () => Promise.resolve('mock-token')
  })
}));

// Simple mock for fetch used in component
global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { atsScore: 88, atsSuggestions: ['Keep keywords'] } }) }));

// Mock FileReader used in the component
class MockFileReader {
  constructor() { this.onload = null; this.result = null; }
  readAsDataURL(_file) {
    this.result = 'data:application/pdf;base64,ZmFrZURhdGE=';
    if (this.onload) this.onload();
  }
}
global.FileReader = MockFileReader;

import { MemoryRouter } from 'react-router-dom';
import ResumeUpload from './ResumeUpload';

describe('ResumeUpload', () => {
  it('accepts a PDF file and shows AI feedback report after analysis', async () => {
    // Replace setInterval with synchronous runner for deterministic test
    const realSetInterval = global.setInterval;
    const realClearInterval = global.clearInterval;
    global.setInterval = (cb) => { for (let i = 0; i < 6; i++) cb(); return 1; };
    global.clearInterval = () => {};

    const { container } = render(
      <MemoryRouter>
        <ResumeUpload />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

    // simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByText(/Submit & Analyze/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/AI Feedback Report/i)).toBeInTheDocument();
      expect(screen.getByText(/ATS Readiness/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // restore timers
    global.setInterval = realSetInterval;
    global.clearInterval = realClearInterval;
  }, 15000);
});
