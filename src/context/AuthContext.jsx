import { useState, useEffect } from 'react';
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
  const { signOut, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, getToken, user: clerkUser } = useClerkAuth();

  // Default to no user (require explicit signin). Do not auto-restore from saved localStorage.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cg_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cg_user');
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('cg_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed?.demo) setUser(normalizeResumeProfile(parsed));
      } catch {
        // ignore parse errors
      }
    }
    setIsReady(true);
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';

  const login = async (email, password, role) => {
    setLoading(true);
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
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Network error: Failed to reach the server.');
      }
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
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Network error: Failed to reach the server.');
      }
      throw error;
    }
  };

  const getAuthToken = async () => {
    if (clerkLoaded && clerkSignedIn && typeof getToken === 'function') {
      try {
        const token = await getToken();
        if (token) return token;
      } catch {
        // ignore Clerk token retrieval failures and fallback to local token
      }
    }
    return localStorage.getItem('cg_token');
  };

  const logout = async () => {
    setUser(null);
    clearClerkSessionStorage();

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

  const demoSignIn = (role = 'student') => {
    // sign the user in as a demo account locally (marked as demo)
    const demo = MOCK_USERS[role] ? { ...MOCK_USERS[role], demo: true } : { id: `usr_${role}`, name: `Demo ${role}`, email: `${role}@demo.careergenie`, role, demo: true };
    setUser(demo);
    // do not persist demo sessions for auto-restore on app load (restore logic ignores demo flag)
  };

  const updateUserProfile = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = normalizeResumeProfile({ ...prev, ...updatedFields });
      localStorage.setItem('cg_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const fetchProfile = async (userId) => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5178';
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveProfile = async (userId, updates) => {
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
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      // fallback to local update
      updateUserProfile(updates);
      return { ...user, ...updates };
    }
  };

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

