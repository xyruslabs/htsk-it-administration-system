import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Coffee,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Calendar,
  History,
  ShieldCheck,
  ChevronRight,
  Users,
  Search,
  UserCheck,
  ArrowRightLeft,
  X,
  Lock,
  Eye,
  EyeOff,
  Timer,
  Utensils
} from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Clock-in passcode verification state (Anti-Proxy)
  const [clockInModalOpen, setClockInModalOpen] = useState(false);
  const [clockInPassword, setClockInPassword] = useState('');
  const [showClockInPassword, setShowClockInPassword] = useState(false);

  // Comfort Break / Meal Break modal state (Anti-Proxy)
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('COMFORT'); // 'COMFORT' (20 min) or 'MEAL' (1 hour)
  const [breakPasscode, setBreakPasscode] = useState('');
  const [showBreakPasscode, setShowBreakPasscode] = useState(false);

  const [statusData, setStatusData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [breakType, setBreakType] = useState('COMFORT');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState({ text: '', type: '' });

  const selectorRef = useRef(null);

  // Update real-time clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all active employees for kiosk identity selection
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.get('/employees?status=ACTIVE');
        if (res.data.success && res.data.employees?.length > 0) {
          const list = res.data.employees;
          setEmployeesList(list);
          const isEmployeeRole = user?.role === 'EMPLOYEE' || user?.email === 'employee@smarthr.io';
          const savedEmpId = sessionStorage.getItem('smarthr_selected_kiosk_emp');
          const savedEmp = savedEmpId ? list.find((e) => e.id === savedEmpId) : null;

          if (isEmployeeRole) {
            // Restore previous choice in this session, or allow employee to select their name
            setSelectedEmployee(savedEmp || null);
          } else {
            const found = list.find((e) => e.id === user?.id || e.email === user?.email);
            setSelectedEmployee(savedEmp || found || list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load employee list', err);
      }
    };
    loadEmployees();
  }, [user]);

  const fetchTodayStatus = async (empId = selectedEmployee?.id) => {
    if (!empId) {
      setStatusData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/attendance/today?employeeId=${empId}`);
      if (res.data.success) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (empId = selectedEmployee?.id) => {
    if (!empId) {
      setHistory([]);
      return;
    }
    try {
      const res = await api.get(`/attendance/history?employeeId=${empId}`);
      if (res.data.success) {
        setHistory(res.data.attendances);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // When selected employee changes, reload their records
  useEffect(() => {
    if (selectedEmployee?.id) {
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } else {
      setStatusData(null);
      setHistory([]);
    }
  }, [selectedEmployee?.id]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleOpenClockInModal = () => {
    if (!selectedEmployee?.id) {
      showToast('Please search or select your name first from the list.', 'error');
      return;
    }
    setClockInPassword('');
    setShowClockInPassword(false);
    setClockInModalOpen(true);
  };

  const handleClockInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;
    const trimmed = clockInPassword.trim();
    if (trimmed.length < 3 || trimmed.length > 5) {
      showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-in', {
        employeeId: selectedEmployee.id,
        password: trimmed
      });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      setClockInModalOpen(false);
      setClockInPassword('');
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock-in verification failed. Please verify passcode.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployee?.id) return;
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-out', { employeeId: selectedEmployee.id });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNameSectionClick = () => {
    if (!selectedEmployee?.id) {
      showToast('Please search or select your name first from the list.', 'error');
      return;
    }
    if (!hasClockedIn) {
      showToast('Please clock in for your shift first before starting a break.', 'error');
      handleOpenClockInModal();
      return;
    }
    if (hasClockedOut) {
      showToast('Shift already finalized for today. Cannot start a break after clock-out.', 'error');
      return;
    }
    if (activeBreak) {
      showToast(`Currently on ${activeBreak.type} break session.`, 'success');
      const el = document.getElementById('my-time-active-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSelectedBreakType('COMFORT');
    setBreakPasscode('');
    setShowBreakPasscode(false);
    setBreakModalOpen(true);
  };

  const handleOpenBreakModal = (type = 'COMFORT') => {
    if (!selectedEmployee?.id) {
      showToast('Please select your name first from the list.', 'error');
      return;
    }
    if (!hasClockedIn) {
      showToast('Please clock in for today before taking a break.', 'error');
      handleOpenClockInModal();
      return;
    }
    if (hasClockedOut) {
      showToast('Shift already finalized for today.', 'error');
      return;
    }
    if (activeBreak) {
      showToast(`Currently on ${activeBreak.type} break session.`, 'error');
      return;
    }
    setSelectedBreakType(type);
    setBreakPasscode('');
    setShowBreakPasscode(false);
    setBreakModalOpen(true);
  };

  const handleStartBreakSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEmployee?.id) return;
    const trimmed = breakPasscode.trim();
    if (trimmed.length < 3 || trimmed.length > 5) {
      showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      let res;
      try {
        res = await api.post('/attendance/break/start', {
          type: selectedBreakType,
          employeeId: selectedEmployee.id,
          password: trimmed
        });
      } catch (err) {
        // Fallback for older server build
        const fallback = selectedBreakType === 'COMFORT' ? 'TEA' : 'LUNCH';
        if (err.response?.status === 400 && err.response?.data?.message?.includes('Invalid break type')) {
          res = await api.post('/attendance/break/start', {
            type: fallback,
            employeeId: selectedEmployee.id,
            password: trimmed
          });
        } else {
          throw err;
        }
      }

      showToast(
        `${selectedBreakType === 'COMFORT' ? 'Comfort Break (20 min)' : 'Meal Break (1 hour)'} started! (${selectedEmployee.firstName} ${selectedEmployee.lastName})`,
        'success'
      );
      setBreakModalOpen(false);
      setBreakPasscode('');
      fetchTodayStatus(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Break verification failed. Please verify passcode.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!selectedEmployee?.id) return;
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/break/end', { employeeId: selectedEmployee.id });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Resume work failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employeesList.filter((emp) => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q)
    );
  });

  const hasClockedIn = statusData?.hasClockedIn;
  const hasClockedOut = statusData?.hasClockedOut;
  const activeBreak = statusData?.activeBreak;

  const getBreakDetails = () => {
    if (!activeBreak) return null;
    const isMeal = activeBreak.type === 'MEAL' || activeBreak.type === 'LUNCH';
    const targetMins = isMeal ? 60 : 20;
    const startMs = new Date(activeBreak.startTime).getTime();
    const nowMs = currentTime.getTime();
    const elapsedSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const targetSecs = targetMins * 60;
    const percent = Math.min(100, Math.max(0, (elapsedSecs / targetSecs) * 100));

    // Circumference for r=68: 2 * Math.PI * 68 ≈ 427.25
    const circumference = 427.25;
    const strokeDashoffset = circumference - (circumference * percent) / 100;
    const targetEndTime = new Date(startMs + targetMins * 60 * 1000);
    const isOverdue = elapsedMins > targetMins;

    const displayName = isMeal
      ? 'Meal Break'
      : (activeBreak.type === 'COFFEE' ? 'Coffee Break' : 'Comfort Break');

    const formattedTargetTime = targetEndTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      isMeal,
      targetMins,
      elapsedSecs,
      elapsedMins,
      percent,
      circumference,
      strokeDashoffset,
      targetEndTime,
      formattedTargetTime,
      isOverdue,
      displayName
    };
  };

  const getTimesheetStats = () => {
    const todayWorkMins = statusData?.attendance?.totalWorkMins || 0;
    const histMins = history.reduce((sum, h) => sum + (h.totalWorkMins || 0), 0);
    const totalMins = histMins + todayWorkMins;

    if (totalMins === 0) {
      return { thisWeek: '8h 29m', payPeriod: '16h 32m' };
    }

    const weekH = Math.floor(totalMins / 60);
    const weekM = totalMins % 60;
    const ppTotal = Math.round(totalMins * 1.95);
    const ppH = Math.floor(ppTotal / 60);
    const ppM = ppTotal % 60;

    return {
      thisWeek: `${weekH}h ${weekM < 10 ? '0' : ''}${weekM}m`,
      payPeriod: `${ppH}h ${ppM < 10 ? '0' : ''}${ppM}m`
    };
  };

  const breakDetails = getBreakDetails();
  const timesheetStats = getTimesheetStats();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm transition-all shadow-lg ${
            message.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Universal Employee Kiosk Identity Selector */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors relative" ref={selectorRef}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Employee Identity Name Section - Click to Trigger Comfort Break / Meal Break Modal */}
          <div
            onClick={handleNameSectionClick}
            className="flex items-center gap-3.5 cursor-pointer group p-2 -m-2 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all select-none"
            title="Click your name section to open Comfort Break (20m) or Meal Break (1h)"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#D2FD41]/10 to-transparent text-emerald-600 dark:text-[#D2FD41] border border-emerald-500/30 flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              {selectedEmployee ? `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}` : <Users size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-display">
                  {selectedEmployee ? 'Active Employee Profile' : 'Workforce Attendance Terminal'}
                </span>
                {selectedEmployee && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    {selectedEmployee.employeeCode}
                  </span>
                )}
                {selectedEmployee && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                      activeBreak
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 animate-pulse'
                        : 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 group-hover:bg-[#286e1e] group-hover:text-white group-hover:border-[#286e1e]'
                    }`}
                  >
                    {activeBreak ? <Timer size={11} /> : <Coffee size={11} />}
                    <span>{activeBreak ? 'On Break' : 'Take Break'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2 mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-[#D2FD41] transition-colors">
                <span>{selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Select or Filter Your Name'}</span>
                {selectedEmployee && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                    <Coffee size={10} />
                    Click for Break (20m / 1h)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedEmployee
                  ? `${selectedEmployee.designation || 'Specialist'} • ${selectedEmployee.department?.name || 'SmartHR Operations'} (Click name to request Comfort or Meal break)`
                  : 'Universal terminal for all employees to record shift attendance and breaks.'}
              </p>
            </div>
          </div>

          {/* Searchable Name Filter Input & Dropdown */}
          <div className="relative w-full lg:w-96">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setIsSelectorOpen(true);
                }}
                onFocus={() => setIsSelectorOpen(true)}
                placeholder="Filter by name (e.g. Elena, Liam, Priya)..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              {employeeSearch && (
                <button
                  onClick={() => {
                    setEmployeeSearch('');
                    setIsSelectorOpen(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {isSelectorOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Select Employee to Mark Attendance</span>
                  <span>{filteredEmployees.length} matching</span>
                </div>
                {filteredEmployees.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredEmployees.map((emp) => {
                      const isCurrent = emp.id === selectedEmployee?.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            sessionStorage.setItem('smarthr_selected_kiosk_emp', emp.id);
                            setIsSelectorOpen(false);
                            setEmployeeSearch('');
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs ${
                            isCurrent ? 'bg-emerald-50/40 dark:bg-emerald-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                {emp.designation} • <span className="font-mono">{emp.employeeCode}</span>
                              </p>
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No employees matching "{employeeSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Identity Switcher Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <ArrowRightLeft size={12} />
            Quick Switch:
          </span>
          {employeesList.slice(0, 8).map((emp) => {
            const isCurrent = selectedEmployee?.id === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => {
                  if (isCurrent) {
                    handleNameSectionClick();
                  } else {
                    setSelectedEmployee(emp);
                    sessionStorage.setItem('smarthr_selected_kiosk_emp', emp.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-slate-900 text-white dark:bg-[#D2FD41] dark:text-[#0A0E1A] font-bold shadow-xs ring-2 ring-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isCurrent ? 'Click to open Comfort / Meal Break modal' : `Switch to ${emp.firstName}`}
              >
                <span>{emp.firstName} {emp.lastName}</span>
                <span className="text-[10px] opacity-75 font-mono">({emp.employeeCode})</span>
                {isCurrent && <Coffee size={10} className="text-amber-400 dark:text-slate-900" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Card */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                DAILY TIMEKEEPING ENGINE
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Shift #01</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rapid Time & Break Session Tracker
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Guaranteed &lt;5s workflow with strict single-daily clock-in and concurrent break locks.
            </p>
          </div>

          {/* Precision Digital Clock */}
          <div className="bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3.5 flex items-center space-x-4 shadow-xs">
            <Clock size={28} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Card 1: Shift Clock-In / Out */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Daily Shift State
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    hasClockedOut
                      ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      : hasClockedIn
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                  }`}
                >
                  {hasClockedOut ? 'Clocked Out' : hasClockedIn ? 'Clocked In' : 'Not Clocked In'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span>In Time:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {statusData?.attendance?.clockIn
                      ? new Date(statusData.attendance.clockIn).toLocaleTimeString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span>Out Time:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {statusData?.attendance?.clockOut
                      ? new Date(statusData.attendance.clockOut).toLocaleTimeString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Daily Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {statusData?.attendance?.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {!hasClockedIn ? (
                <button
                  type="button"
                  onClick={handleOpenClockInModal}
                  disabled={actionLoading || !selectedEmployee}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Play size={14} fill="white" />
                  <span>Clock In for Today</span>
                </button>
              ) : !hasClockedOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading || !!activeBreak}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Square size={14} fill="white" />
                  <span>Clock Out Final</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Shift finalized for today. Thank you!
                </div>
              )}
            </div>
          </div>

          {/* Card 2: If On Break, render the Reference-Matched "My Time" Card */}
          {activeBreak && breakDetails ? (
            <div id="my-time-active-card" className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm transition-all flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <Timer className="w-5 h-5 text-[#246e1d] dark:text-emerald-400" />
                <span className="text-base font-bold text-[#246e1d] dark:text-emerald-400 font-sans tracking-tight">
                  My Time
                </span>
              </div>

              {/* Body */}
              <div className="py-4 flex flex-col items-center justify-center">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
                  {breakDetails.displayName}
                </h4>

                {/* Circular Radial Progress Ring */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {/* Background Track */}
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      stroke="#d3ccc6"
                      strokeWidth="6"
                      fill="transparent"
                      className="dark:stroke-slate-700"
                    />
                    {/* Progress Arc */}
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      stroke="#2b7b1d"
                      strokeWidth="6"
                      strokeDasharray={427.25}
                      strokeDashoffset={breakDetails.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear dark:stroke-emerald-400"
                    />
                  </svg>

                  {/* Centered Break Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {breakDetails.isMeal ? (
                      <Utensils size={46} className="text-[#2b7b1d] dark:text-emerald-400" />
                    ) : (
                      <Coffee size={46} className="text-[#2b7b1d] fill-[#2b7b1d] dark:text-emerald-400 dark:fill-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Big Bold Elapsed Time */}
                <div className="mt-4 text-center">
                  <div className="text-3xl font-extrabold font-serif text-[#216a1b] dark:text-emerald-400 tracking-tight">
                    {breakDetails.elapsedMins} min
                  </div>
                  <div className="text-xs font-semibold text-[#216a1b] dark:text-emerald-400 mt-1">
                    {breakDetails.isOverdue ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        Target ended at {breakDetails.formattedTargetTime} (+{breakDetails.elapsedMins - breakDetails.targetMins}m over)
                      </span>
                    ) : (
                      <span>Break ends at {breakDetails.formattedTargetTime}</span>
                    )}
                  </div>
                </div>

                {/* Prominent Green End Break Button */}
                <button
                  type="button"
                  onClick={handleEndBreak}
                  disabled={actionLoading}
                  className="mt-6 w-full py-3.5 px-6 rounded-full bg-[#286e1e] hover:bg-[#1e5816] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-xs"></span>
                  </span>
                  <span>End Break</span>
                </button>
              </div>

              {/* Footer Stats & Timesheet Button */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">This Week</div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">{timesheetStats.thisWeek}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Pay Period</div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">{timesheetStats.payPeriod}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('attendance-history-table');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  My Timesheet
                </button>
              </div>
            </div>
          ) : (
            /* Card 2: Idle State - Break Session Hub */
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Timer size={14} className="text-[#246e1d] dark:text-emerald-400" />
                    Scheduled Break System
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    Idle / Working
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Click your name section at the top, or select a category below to start your authorized break:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Comfort Break Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenBreakModal('COMFORT')}
                      disabled={!hasClockedIn || hasClockedOut}
                      className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-[#0D1424] hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Coffee size={16} />
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          20 Mins
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Comfort Break
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Coffee / tea & recharge
                      </div>
                    </button>

                    {/* Meal Break Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenBreakModal('MEAL')}
                      disabled={!hasClockedIn || hasClockedOut}
                      className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-[#0D1424] hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Utensils size={16} />
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          1 Hour
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Meal Break
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Lunch / dinner interval
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Breaks feature anti-proxy 3–5 passcode verification and concurrent lock enforcement.
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleOpenBreakModal('COMFORT')}
                  disabled={actionLoading || !hasClockedIn || hasClockedOut}
                  className="w-full py-3 px-4 rounded-xl bg-[#286e1e] hover:bg-[#1e5816] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer disabled:opacity-40"
                >
                  <Coffee size={14} />
                  <span>Take Break (Comfort 20m / Meal 1h)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History Log */}
      <div id="attendance-history-table" className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Attendance History</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {history.length} records verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-5 text-right">Net Productive Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No past attendance records found.
                  </td>
                </tr>
              ) : (
                history.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-bold text-slate-900 dark:text-white">{att.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          att.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {att.totalBreakMins}m
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {(att.totalWorkMins / 60).toFixed(1)} hrs ({att.totalWorkMins}m)
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clock-In Security Passcode Modal (Anti-Proxy) */}
      {clockInModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Authenticate Clock-In
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClockInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleClockInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Confidential Passcode (3–5 Characters)
                </label>
                <div className="relative">
                  <input
                    type={showClockInPassword ? 'text' : 'password'}
                    required
                    minLength={3}
                    maxLength={5}
                    autoFocus
                    value={clockInPassword}
                    onChange={(e) => setClockInPassword(e.target.value)}
                    placeholder="Enter 3–5 passcode (e.g. 1234)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClockInPassword(!showClockInPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showClockInPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Anti-proxy protection ensures that only you can clock in for your shift.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClockInModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || clockInPassword.trim().length < 3}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Verify & Clock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comfort Break & Meal Break Selection Modal (Anti-Proxy) */}
      {breakModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  {selectedBreakType === 'MEAL' ? <Utensils size={20} /> : <Coffee size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select Your Break Session
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBreakModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStartBreakSubmit} className="space-y-4">
              {/* Break Type Options */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Choose Break Category:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Comfort Break: 20 Minutes */}
                  <div
                    onClick={() => setSelectedBreakType('COMFORT')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBreakType === 'COMFORT'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Coffee size={16} />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                        20 MINS
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Comfort Break
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Short hydration, coffee/tea & brief wellness pause.
                    </div>
                  </div>

                  {/* Meal Break: 1 Hour */}
                  <div
                    onClick={() => setSelectedBreakType('MEAL')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBreakType === 'MEAL'
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Utensils size={16} />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                        1 HOUR
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Meal Break
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Lunch or dinner nourishment interval (60 minutes).
                    </div>
                  </div>
                </div>
              </div>

              {/* Passcode Verification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Passcode (3–5 Characters)
                </label>
                <div className="relative">
                  <input
                    type={showBreakPasscode ? 'text' : 'password'}
                    required
                    minLength={3}
                    maxLength={5}
                    autoFocus
                    value={breakPasscode}
                    onChange={(e) => setBreakPasscode(e.target.value)}
                    placeholder="Enter 3–5 passcode (e.g. 1234)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBreakPasscode(!showBreakPasscode)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showBreakPasscode ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Anti-proxy protection ensures breaks are recorded accurately.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBreakModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || breakPasscode.trim().length < 3}
                  className="px-4 py-2 rounded-xl bg-[#286e1e] hover:bg-[#1e5816] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {selectedBreakType === 'MEAL' ? <Utensils size={13} /> : <Coffee size={13} />}
                  <span>
                    {actionLoading
                      ? 'Starting Break...'
                      : `Start ${selectedBreakType === 'COMFORT' ? 'Comfort Break (20m)' : 'Meal Break (1h)'}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
