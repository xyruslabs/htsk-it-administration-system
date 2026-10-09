import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/floor-monitor');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-slate-900/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Theme Toggle on Login Page */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-slate-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 relative z-10 transition-colors">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 mx-auto flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-emerald-900/40 mb-3 ring-1 ring-white/10">
            S
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            SmartHR Enterprise
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Single Sign-On Workforce Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start space-x-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Work Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smarthr.io"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/30 hover:shadow-emerald-900/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Session...' : 'Authenticate & Enter'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Role Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
            Instant Test Personas (Click to Load)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoSelect('admin@smarthr.io')}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-600 dark:text-purple-400">Super Admin</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">admin@smarthr.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('hr@smarthr.io')}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">HR Manager</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">hr@smarthr.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('lead@smarthr.io')}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-amber-600 dark:text-amber-400">Team Lead</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">lead@smarthr.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('employee@smarthr.io')}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-blue-600 dark:text-blue-400">Employee</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">employee@smarthr.io</div>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
            Password: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
};
