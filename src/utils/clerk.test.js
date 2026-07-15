import { beforeEach, describe, it, expect } from 'vitest';
import { clearClerkSessionStorage, normalizeClerkUser } from './clerk.js';

describe('normalizeClerkUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps Clerk profile data into the app user shape', () => {
    const clerkUser = {
      id: 'clerk_123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      emailAddresses: [{ emailAddress: 'ada@example.com' }],
      publicMetadata: { role: 'recruiter' }
    };

    const normalized = normalizeClerkUser(clerkUser, 'student');

    expect(normalized).toMatchObject({
      id: 'clerk_123',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'recruiter'
    });
  });

  it('falls back to the selected role when Clerk metadata is missing', () => {
    const normalized = normalizeClerkUser({
      id: 'clerk_456',
      firstName: 'Grace',
      lastName: 'Hopper',
      emailAddresses: [{ emailAddress: 'grace@example.com' }]
    }, 'admin');

    expect(normalized.role).toBe('admin');
    expect(normalized.name).toBe('Grace Hopper');
  });

  it('clears persisted auth state for a full sign-out', () => {
    localStorage.setItem('cg_user', JSON.stringify({ id: 'demo' }));
    localStorage.setItem('cg_token', 'demo-token');
    localStorage.setItem('clerk_session', JSON.stringify({ id: 'demo' }));

    clearClerkSessionStorage();

    expect(localStorage.getItem('cg_user')).toBeNull();
    expect(localStorage.getItem('cg_token')).toBeNull();
    expect(localStorage.getItem('clerk_session')).toBeNull();
  });
});
