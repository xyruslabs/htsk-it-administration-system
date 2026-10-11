import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Clock,
  Coffee,
  Building2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Users,
  Timer,
  Utensils,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
  ExternalLink,
  Briefcase,
  Layers,
  ChevronRight,
  Shield,
  Palette
} from 'lucide-react';

export const HrSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('SHIFTS'); // 'SHIFTS' | 'BREAKS' | 'DEPARTMENTS' | 'LEAVES' | 'COMPANY'
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Data from backend
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [checklist, setChecklist] = useState([]);

  // New Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const fetchHrSetupData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/hr-setup');
      if (res.data.success) {
        setSettings(res.data.settings);
        setDepartments(res.data.departments || []);
        setSummary(res.data.summary);
        setChecklist(res.data.checklist || []);
      }
    } catch (err) {
      console.error('Failed to load HR setup data:', err);
      showToast(err.response?.data?.message || 'Failed to fetch HR policies.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrSetupData();
  }, []);

  const handleSaveAllSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/admin/hr-setup', settings);
      if (res.data.success) {
        setSettings(res.data.settings);
        showToast('Enterprise HR policies and configurations saved successfully.', 'success');
        fetchHrSetupData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save HR setup.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      showToast('Department name and code are required.', 'error');
      return;
    }
    try {
      setDeptSubmitting(true);
      const res = await api.post('/employees/departments', deptForm);
      if (res.data.success) {
        showToast(`Department "${deptForm.name}" created successfully.`, 'success');
        setDeptForm({ name: '', code: '', description: '' });
        setIsDeptModalOpen(false);
        fetchHrSetupData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create department.', 'error');
    } finally {
      setDeptSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Enterprise HR Setup Console...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm transition-all shadow-lg animate-in fade-in duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider font-mono">
                ENTERPRISE HR SETUP & POLICY CENTER
              </span>
              <span className="text-xs text-slate-400 font-medium">Inspired by Frappe HR Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="text-emerald-600 dark:text-emerald-400 w-7 h-7" />
              <span>HR Setup & Governance Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Central management console for shift windows, break policy limits, department trees, and compliance rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHrSetupData()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleSaveAllSettings}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving Policies...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {/* Setup Score & Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shift Window</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {settings?.shiftPolicy?.startTime || '09:00'} — {settings?.shiftPolicy?.endTime || '17:30'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              +{settings?.shiftPolicy?.lateEntryGracePeriodMins || 15}m Grace Window
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Break Policies</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {settings?.breakPolicy?.comfortBreakMins || 20}m / {settings?.breakPolicy?.mealBreakMins || 60}m
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Passcode Protected
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Divisions</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {summary?.totalDepartments || departments.length} Departments
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {summary?.totalEmployees || 0} Total Personnel
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Setup Score</div>
            <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
              {summary?.setupScore || 100}% Complete
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {summary?.completedSteps || 7} of {summary?.totalSteps || 7} Steps Verified
            </div>
          </div>
        </div>
      </div>

      {/* Frappe-Inspired Onboarding Roadmap Checklist */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Frappe HR Setup Checklist & Governance Roadmap
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                System onboarding status across corporate timekeeping, attendance rules, and organizational hierarchy.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30">
            {summary?.setupScore || 100}% Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
          {checklist.map((step, idx) => (
            <div
              key={step.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                step.completed
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
                  : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {step.badge}
                </span>
                {step.completed ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Pending
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {step.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'SHIFTS'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock size={14} />
          <span>Shift & Grace Periods</span>
        </button>

        <button
          onClick={() => setActiveTab('BREAKS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'BREAKS'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Coffee size={14} />
          <span>Break Policy Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'DEPARTMENTS'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 size={14} />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'LEAVES'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays size={14} />
          <span>Leave Policy Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'COMPANY'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase size={14} />
          <span>Company & Work Hours</span>
        </button>
      </div>

      {/* TAB 1: SHIFTS & GRACE PERIODS */}
      {activeTab === 'SHIFTS' && settings && (
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="text-emerald-500" size={18} />
                Shift Types, Timings & Grace Policies
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure official shift windows and automated threshold policies modeled on Frappe Shift Type rules.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30">
              Active Shift #01
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shift Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift Designation Name
              </label>
              <input
                type="text"
                value={settings.shiftPolicy.shiftName || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shiftPolicy: { ...settings.shiftPolicy, shiftName: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Roster Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Roster Color Tag</span>
                <span className="font-mono text-[10px] text-slate-400">{settings.shiftPolicy.rosterColor}</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.shiftPolicy.rosterColor || '#10b981'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shiftPolicy: { ...settings.shiftPolicy, rosterColor: e.target.value }
                    })
                  }
                  className="w-10 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                />
                <div
                  className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono text-white flex items-center gap-2 shadow-xs"
                  style={{ backgroundColor: settings.shiftPolicy.rosterColor || '#10b981' }}
                >
                  <Palette size={13} />
                  <span>Preview Tag</span>
                </div>
              </div>
            </div>

            {/* Shift Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift Start Time (24h)
              </label>
              <input
                type="time"
                value={settings.shiftPolicy.startTime || '09:00'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shiftPolicy: { ...settings.shiftPolicy, startTime: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Shift End Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift End Time (24h)
              </label>
              <input
                type="time"
                value={settings.shiftPolicy.endTime || '17:30'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shiftPolicy: { ...settings.shiftPolicy, endTime: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Late Entry Grace Period */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Late Entry Grace Period
                </label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {settings.shiftPolicy.lateEntryGracePeriodMins || 15} Minutes
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={settings.shiftPolicy.lateEntryGracePeriodMins || 15}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shiftPolicy: {
                      ...settings.shiftPolicy,
                      lateEntryGracePeriodMins: parseInt(e.target.value)
                    }
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <Info size={12} className="text-emerald-500 shrink-0" />
                Staff clocking in within {settings.shiftPolicy.lateEntryGracePeriodMins || 15}m after {settings.shiftPolicy.startTime} are credited as Present rather than flagged Late.
              </p>
            </div>

            {/* Early Exit Grace Period */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Early Exit Grace Period
                </label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {settings.shiftPolicy.earlyExitGracePeriodMins || 15} Minutes
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={settings.shiftPolicy.earlyExitGracePeriodMins || 15}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shiftPolicy: {
                      ...settings.shiftPolicy,
                      earlyExitGracePeriodMins: parseInt(e.target.value)
                    }
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <Info size={12} className="text-emerald-500 shrink-0" />
                Allows departing up to {settings.shiftPolicy.earlyExitGracePeriodMins || 15}m prior to shift end without incurring an unexcused early exit flag.
              </p>
            </div>

            {/* Half Day Working Hours Threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Half-Day Minimum Hours Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="8"
                  value={settings.shiftPolicy.halfDayThresholdHours || 4.5}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shiftPolicy: {
                        ...settings.shiftPolicy,
                        halfDayThresholdHours: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Hours</span>
              </div>
            </div>

            {/* Absent Working Hours Threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Absent Working Hours Threshold (Below this = Absent)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="4"
                  value={settings.shiftPolicy.absentThresholdHours || 2.5}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shiftPolicy: {
                        ...settings.shiftPolicy,
                        absentThresholdHours: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BREAK POLICY ENGINE */}
      {activeTab === 'BREAKS' && settings && (
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee className="text-emerald-500" size={18} />
                Break Policies, Limits & Anti-Proxy Enforcement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Governs the dual-category Comfort Break and Meal Break rules enforced on the Break Time terminal.
              </p>
            </div>
            <Link
              to="/break-time"
              className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
            >
              <span>View Break Terminal</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comfort Break Limit */}
            <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Coffee size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Comfort Break Policy Limit
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Short hydration, tea & wellness intervals
                    </span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                  {settings.breakPolicy.comfortBreakMins || 20}m
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="30"
                step="5"
                value={settings.breakPolicy.comfortBreakMins || 20}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    breakPolicy: {
                      ...settings.breakPolicy,
                      comfortBreakMins: parseInt(e.target.value)
                    }
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Breaks exceeding {settings.breakPolicy.comfortBreakMins || 20} minutes are automatically flagged as <strong>EXCEEDED LIMIT</strong> on compliance dashboards.
              </p>
            </div>

            {/* Meal Break Limit */}
            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Meal Break Policy Limit
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Lunch and dinner nourishment interval
                    </span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {settings.breakPolicy.mealBreakMins || 60}m
                </span>
              </div>

              <input
                type="range"
                min="30"
                max="90"
                step="15"
                value={settings.breakPolicy.mealBreakMins || 60}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    breakPolicy: {
                      ...settings.breakPolicy,
                      mealBreakMins: parseInt(e.target.value)
                    }
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Standard {settings.breakPolicy.mealBreakMins || 60}-minute nourishment allowance for full-time shifts.
              </p>
            </div>
          </div>

          {/* Security & Anti-Proxy Options */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Anti-Proxy Protection & Concurrency Controls</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="antiProxy"
                  checked={Boolean(settings.breakPolicy.antiProxyPasscodeEnabled)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      breakPolicy: {
                        ...settings.breakPolicy,
                        antiProxyPasscodeEnabled: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="antiProxy" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Enforce Anti-Proxy Passcode Verification
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Requires a 3–5 character passcode before starting or ending breaks to eliminate buddy-punching.
                  </span>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="concurrentLock"
                  checked={Boolean(settings.breakPolicy.concurrentBreakLock)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      breakPolicy: {
                        ...settings.breakPolicy,
                        concurrentBreakLock: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="concurrentLock" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Concurrent Break Interlock
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Prevents starting a new break session if an active break is already running for the employee.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS & ORGANIZATIONAL STRUCTURE */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="text-emerald-500" size={18} />
                Corporate Departments & Divisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Organized company hierarchy structure modeled on Frappe HR Department Master.
              </p>
            </div>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                    {dept.code}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {dept._count?.employees || 0} Staff
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dept.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {dept.description || 'Enterprise department division.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE POLICY QUOTAS & GOVERNANCE */}
      {activeTab === 'LEAVES' && settings && (
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="text-emerald-500" size={18} />
                Leave Types, Annual Allocations & Anti-Self-Approval
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Default annual quotas and anti-conflict rules inspired by Frappe Leave Policy settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Annual Leave */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Annual Vacation Leave
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={settings.leavePolicy.annualLeaveQuota || 14}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        annualLeaveQuota: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">Days/Yr</span>
              </div>
            </div>

            {/* Medical Leave */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Medical / Sick Leave
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.leavePolicy.medicalLeaveQuota || 14}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        medicalLeaveQuota: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">Days/Yr</span>
              </div>
            </div>

            {/* Casual Leave */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Casual / Personal Leave
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.leavePolicy.casualLeaveQuota || 7}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        casualLeaveQuota: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">Days/Yr</span>
              </div>
            </div>
          </div>

          {/* Compliance switches */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Enterprise Leave Governance Rules
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="antiSelf"
                  checked={Boolean(settings.leavePolicy.antiSelfApproval)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        antiSelfApproval: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="antiSelf" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Strict Anti-Self-Approval Enforcement
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Prevents Managers or HR Admins from approving their own leave applications (mandatory approval escalation).
                  </span>
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="backdate"
                  checked={Boolean(settings.leavePolicy.restrictBackdatedLeaves)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        restrictBackdatedLeaves: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="backdate" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Restrict Backdated Leave Applications
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Prohibits filing leave requests for dates that have already passed without Super Admin pre-authorization.
                  </span>
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="carryFwd"
                  checked={Boolean(settings.leavePolicy.allowCarryForward)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leavePolicy: {
                        ...settings.leavePolicy,
                        allowCarryForward: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="carryFwd" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Allow Annual Leave Carry-Forward
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Unused annual leave balances automatically roll over to the subsequent calendar year quota.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COMPANY & WORK HOURS */}
      {activeTab === 'COMPANY' && settings && (
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="text-emerald-500" size={18} />
              Company Profile & Corporate Operating Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              General organizational parameters and official standard workweek schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Legal Identity
              </label>
              <input
                type="text"
                value={settings.company.name || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, name: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Standard Working Hours Per Day
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  value={settings.company.standardWorkingHours || 8.5}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: {
                        ...settings.company,
                        standardWorkingHours: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Hours</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Timezone
              </label>
              <input
                type="text"
                value={settings.company.timezone || 'Asia/Colombo (UTC+05:30)'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, timezone: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Operating Currency
              </label>
              <input
                type="text"
                value={settings.company.currency || 'USD ($)'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, currency: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Actions Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock size={14} className="text-emerald-500" />
          <span>Last modified by <strong>{settings?.updatedBy || 'Admin'}</strong></span>
        </div>
        <button
          onClick={handleSaveAllSettings}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save All HR Setup Changes'}</span>
        </button>
      </div>

      {/* Add Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Corporate Department
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create new functional business unit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality Assurance"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Code (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QA"
                  maxLength={6}
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief function of this division..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {deptSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
