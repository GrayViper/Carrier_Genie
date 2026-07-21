import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useClerk as useClerkAuth } from '@clerk/react';
import { AuthContext } from './AuthContextValue';
import { clearClerkSessionStorage, normalizeClerkUser } from '../utils/clerk';
import { normalizeResumeProfile } from '../utils/resumeStorage';

const MOCK_USERS = {
  student: {
    id: 'usr_student',
    name: 'Olivia Chen',
    email: 'olivia@gmail.com',
    role: 'student',
    skills: ['React', 'JavaScript', 'HTML/CSS', 'UX Design', 'Figma', 'Python'],
    resumeUploaded: true,
    resumeName: 'Olivia_Chen_Resume_2026.pdf',
    resumeScore: 84,
    major: 'Computer Science',
    graduationYear: 2026,
    feedback: {
      score: 84,
      strengths: [
        'Strong React and JavaScript fundamentals demonstrated in projects.',
        'Excellent visual UI layout portfolio references.',
        'Good understanding of design tools like Figma.'
      ],
      weaknesses: [
        'Lacks cloud deployment credentials (AWS/GCP).',
        'Could benefit from more backend experience (Node.js/Express).',
        'No testing framework (Jest/Cypress) mentioned.'
      ],
      suggestions: [
        'Add a Node.js project to demonstrate full-stack capability.',
        'List experience with Git/GitHub and CI/CD pipelines.',
        'Include testing tools in the Skills section.'
      ]
    }
  },
  recruiter: {
    id: 'usr_recruiter',
    name: 'David Miller',
    email: 'david@stripe.com',
    role: 'recruiter',
    company: 'Stripe',
    companyLogo: 'S'
  },
  admin: {
    id: 'usr_admin',
    name: 'Alex Mercer',
    email: 'admin@careergenie.com',
    role: 'admin'
  }
};

export const AuthProvider = ({ children }) => {
  let clerkAuth = {};
  try {
    clerkAuth = useClerkAuth();
  } catch (e) {
    // In unit test environments without ClerkProvider, fallback gracefully
  }
  const clerkAuthRef = useRef(clerkAuth);
  clerkAuthRef.current = clerkAuth;

  const { signOut, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user: clerkUser } = clerkAuth;

  // Default to no user (require explicit signin). Do not auto-restore from saved localStorage.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cg_user', JSON.stringify(user));
    }
    // intentionally not removing cg_user when null —
    // logout() handles cleanup explicitly to avoid wiping session during re-renders
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('cg_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed) return;

        if (!parsed.demo) {
          // Regular (non-demo) users: always restore
          setUser(normalizeResumeProfile(parsed));
        } else {
          // Demo users: ONLY restore if cg_role exactly matches the saved user role.
          // If cg_role is missing (stale pre-fix session), refuse to restore — require fresh sign-in.
          const storedRole = localStorage.getItem('cg_role');
          if (storedRole && storedRole === parsed.role) {
            setUser(normalizeResumeProfile(parsed));
          } else {
            // Stale or mismatched demo session — clear it to prevent cross-role contamination
            localStorage.removeItem('cg_user');
            localStorage.removeItem('cg_token');
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    setIsReady(true);
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';

  const login = async (email, password, role) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(data.user);
      if (data.token) localStorage.setItem('cg_token', data.token);
      return data.user;
    } catch (error) {
      setLoading(false);
      // Surface the original error to caller. Do not perform demo/silent fallback here.
      throw error;
    }
  };

  const signup = async (name, email, password, role, extra = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, ...extra })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setUser(data.user);
      if (data.token) localStorage.setItem('cg_token', data.token);
      return data.user;
    } catch (error) {
      setLoading(false);
      // Surface the original error to caller. Do not perform demo/silent fallback here.
      throw error;
    }
  };

  const getAuthToken = useCallback(async () => {
    const { isLoaded, isSignedIn, getToken } = clerkAuthRef.current;
    if (isLoaded && isSignedIn && typeof getToken === 'function') {
      try {
        const token = await getToken();
        if (token) return token;
      } catch {
        // ignore Clerk token retrieval failures and fallback to local token
      }
    }
    return localStorage.getItem('cg_token');
  }, []);

  const logout = async () => {
    setUser(null);
    clearClerkSessionStorage();
    // Explicitly clear all user-related localStorage on logout
    localStorage.removeItem('cg_user');
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_role');
    Object.keys(localStorage)
      .filter(k => k.startsWith('cg_applications'))
      .forEach(k => localStorage.removeItem(k));

    if (clerkLoaded) {
      try {
        await signOut({ redirectUrl: '/' });
      } catch {
        // Keep local sign-out behavior intact even if Clerk sign-out is unavailable.
      }
    }
  };

  const switchRole = (role) => {
    if (MOCK_USERS[role]) {
      setUser(MOCK_USERS[role]);
    } else {
      setUser({
        id: `usr_${role}`,
        name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        email: `${role}@careergenie.com`,
        role: role,
        skills: role === 'student' ? ['JavaScript'] : []
      });
    }
  };

  const demoSignIn = async (role = 'student') => {
    const demo = MOCK_USERS[role]
      ? { ...MOCK_USERS[role], demo: true }
      : { id: `usr_${role}`, name: `Demo ${role}`, email: `${role}@demo.careergenie`, role, demo: true };
    setUser(demo);
    // Store the active role so session restore can match token to the correct user
    localStorage.setItem('cg_role', role);
    // Try to obtain a real JWT from the server
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('cg_token', data.token);
        // Only use server user data if the role matches what we requested
        if (data.user && data.user.role === role) {
          setUser({ ...data.user, demo: true });
        }
        return;
      }
    } catch {
      // server unreachable — fall back to base64 dev token
    }
    // Dev fallback: encode the user object as base64 so the backend's dev-auth recognises it
    const devToken = btoa(JSON.stringify({ sub: demo.id, role: demo.role, email: demo.email, name: demo.name }));
    localStorage.setItem('cg_token', devToken);
  };

  const updateUserProfile = useCallback((updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = normalizeResumeProfile({ ...prev, ...updatedFields });
      localStorage.setItem('cg_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await res.json();
      if (res.ok && data.user && data.user.id) {
        // Only merge if server user matches the current user's id AND role.
        // Prevents cross-session contamination (e.g., recruiter token overwriting student).
        setUser(prev => {
          if (!prev || prev.id !== data.user.id || prev.role !== data.user.role) return prev;
          const merged = normalizeResumeProfile({ ...prev, ...data.user });
          localStorage.setItem('cg_user', JSON.stringify(merged));
          return merged;
        });
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  }, [getAuthToken]);

  const saveProfile = useCallback(async (userId, updates) => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Merge only the update fields — never replace the full user object with server data
        // to avoid cross-session contamination (e.g., recruiter token overwriting student profile).
        updateUserProfile(updates);
        return data.user;
      }
      return null;
    } catch {
      // fallback to local update
      updateUserProfile(updates);
      return null;
    }
  }, [getAuthToken, updateUserProfile]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, switchRole, demoSignIn, updateUserProfile, fetchProfile, saveProfile, getAuthToken, loading, isReady }}>
      {isReady ? children : <div className="min-h-screen flex items-center justify-center text-white">Loading session...</div>}
    </AuthContext.Provider>
  );
};

// re-export the context and hook for compatibility with existing imports
export { AuthContext } from './AuthContextValue';
export { useAuth } from './useAuth';

