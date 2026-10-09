import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SmartHRLogo } from '../components/SmartHRLogo';
import api from '../api/axios';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Forgot Password modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = enter email, 2 = enter code & new pass, 3 = success
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [demoHintCode, setDemoHintCode] = useState('');

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

  // Step 1: Request Password Reset Code
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail });
      if (res.data.success) {
        if (res.data.resetCode) {
          setDemoHintCode(res.data.resetCode);
          setResetCode(res.data.resetCode); // auto-fill for frictionless UX
        }
        setResetStep(2);
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to request password reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Submit New Password with Code
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail,
        resetCode,
        newPassword
      });

      if (res.data.success) {
        setResetStep(3);
        setPassword(newPassword);
        setEmail(resetEmail);
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Password reset failed. Invalid or expired code.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setForgotModal(false);
    setResetStep(1);
    setResetError('');
    setDemoHintCode('');
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
          <div className="flex justify-center mb-3">
            <SmartHRLogo className="w-14 h-14" textSize="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Smart<span className="text-emerald-500 font-extrabold">HR</span> Enterprise
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || 'employee@smarthr.io');
                  setForgotModal(true);
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
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

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-colors">
            {/* Step 1: Request Code */}
            {resetStep === 1 && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Forgot Account Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter your corporate work email to receive a reset code.
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Work Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. employee@smarthr.io"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? 'Generating Code...' : 'Send Verification Code'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Verification Code & New Password */}
            {resetStep === 2 && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Enter Reset Code & New Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Code issued for <span className="font-semibold">{resetEmail}</span>
                    </p>
                  </div>
                </div>

                {demoHintCode && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs">
                    <p className="font-semibold">🔑 Demo Verification Code: <span className="font-mono text-sm tracking-widest">{demoHintCode}</span></p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">(Pre-filled automatically for your convenience)</p>
                  </div>
                )}

                {resetError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={closeResetModal}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
                      >
                        {resetLoading ? 'Resetting...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success Confirmation */}
            {resetStep === 3 && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Your credentials have been securely updated. Your new password has been populated in the login field.
                </p>
                <div className="pt-2">
                  <button
                    onClick={closeResetModal}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
