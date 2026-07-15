import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

const mockUseClerkAuth = vi.fn();

vi.mock('@clerk/react', () => ({
  useClerk: () => mockUseClerkAuth()
}));

function TestConsumer() {
  const { user } = useAuth();
  return <div>{user ? `${user.name} (${user.role})` : 'no-user'}</div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseClerkAuth.mockReturnValue({
      signOut: vi.fn(),
      isLoaded: true,
      isSignedIn: false,
      getToken: vi.fn(),
      user: null
    });
  });

  it('restores a saved student session from localStorage', async () => {
    localStorage.setItem('cg_user', JSON.stringify({ id: 'usr_student', name: 'Olivia', role: 'student' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Olivia (student)')).toBeInTheDocument();
    });
  });
});
