import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Briefcase, Shield, Mail, Lock, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

export default function AuthPages() {
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // student, recruiter, admin
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [savedCredentials, setSavedCredentials] = useState({});

  const credentialStorageKey = 'cg_saved_credentials';

  const loadSavedCredentialsForRole = (selectedRole) => {
    const saved = localStorage.getItem(credentialStorageKey);
    if (!saved) {
      setSavedCredentials({});
      setRememberMe(false);
      setEmail('');
      setPassword('');
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setSavedCredentials(parsed || {});
      const roleCreds = parsed?.[selectedRole];
      if (roleCreds?.email && roleCreds?.password) {
        setEmail(roleCreds.email);
        setPassword(roleCreds.password);
        setRememberMe(true);
      } else {
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
    } catch {
      localStorage.removeItem(credentialStorageKey);
      setSavedCredentials({});
      setRememberMe(false);
      setEmail('');
      setPassword('');
    }
  };

  const saveCredentialsForRole = (selectedRole, currentEmail, currentPassword) => {
    const saved = localStorage.getItem(credentialStorageKey);
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[selectedRole] = { email: currentEmail, password: currentPassword };
    localStorage.setItem(credentialStorageKey, JSON.stringify(parsed));
    setSavedCredentials(parsed);
  };

  const removeSavedCredentialsForRole = (selectedRole) => {
    const saved = localStorage.getItem(credentialStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      delete parsed[selectedRole];
      localStorage.setItem(credentialStorageKey, JSON.stringify(parsed));
      setSavedCredentials(parsed);
      if (selectedRole === role) {
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
    } catch {
      localStorage.removeItem(credentialStorageKey);
      setSavedCredentials({});
      setRememberMe(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    loadSavedCredentialsForRole(newRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      try {
        const u = await login(email, password, role);
        if (rememberMe) {
          saveCredentialsForRole(role, email, password);
        }
        if (u.role === 'student') navigate('/dashboard/student');
        else if (u.role === 'recruiter') navigate('/dashboard/recruiter');
        else if (u.role === 'admin') navigate('/admin');
      } catch (err) {
        setError('Invalid credentials. Please try again.');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      try {
        const u = await signup(name, email, password, role);
        if (rememberMe) {
          saveCredentialsForRole(role, email, password);
        }
        if (u.role === 'student') navigate('/dashboard/student');
        else if (u.role === 'recruiter') navigate('/dashboard/recruiter');
        else if (u.role === 'admin') navigate('/admin');
      } catch (err) {
        setError('Registration failed. Please check details.');
      }
    }
  };

  useEffect(() => {
    loadSavedCredentialsForRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSavedCredentials = () => {
    removeSavedCredentialsForRole(role);
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-blob-purple opacity-40 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blob-blue opacity-35 blur-3xl"></div>

      <div className="z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10"></div>
          
          <div className="relative mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles className="h-3 w-3" />
              {isLogin ? 'Secure access' : 'Fast onboarding'}
            </div>
            <h2 className="mb-2 font-display text-3xl font-black text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-gray-400">
              {isLogin 
                ? 'Sign in to access your smart CareerGenie portal' 
                : 'Start tracking and optimizing your resume matching'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg font-medium text-center">
                {error}
              </div>
            )}

            {/* Name field (for Signup) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Olivia Chen"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? '••••••••' : 'Create a secure password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Select Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Choose Your Role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'student', label: 'Student', icon: <User className="w-4 h-4" /> },
                  { value: 'recruiter', label: 'Recruiter', icon: <Briefcase className="w-4 h-4" /> },
                  { value: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      role === item.value 
                        ? 'border-indigo-500 bg-indigo-600/10 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] font-bold mt-1.5">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save credentials toggle */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                Remember credentials for this role
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  {savedCredentials[role] ? 'Saved for current role' : 'No saved credentials for this role yet.'}
                </span>
                {savedCredentials[role] && (
                  <button
                    type="button"
                    onClick={clearSavedCredentials}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-gray-400 transition hover:border-white/20 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear saved
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Login' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Footer switch link */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-white/5 pt-4">
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Sign up
                </Link>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Login
                </Link>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
