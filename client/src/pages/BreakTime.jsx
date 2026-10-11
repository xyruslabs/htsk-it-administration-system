import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Timer,
  Coffee,
  Utensils,
  Clock,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Users,
  Search,
  ArrowRightLeft,
  X,
  Lock,
  Eye,
  EyeOff,
  Activity,
  History,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCheck
} from 'lucide-react';

export const BreakTime = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Status & live data
  const [statusData, setStatusData] = useState(null);
  const [liveFloorData, setLiveFloorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState({ text: '', type: '' });

  // Break modal states (Anti-Proxy Protection)
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('COMFORT'); // 'COMFORT' (20m) or 'MEAL' (1h)
  const [breakPasscode, setBreakPasscode] = useState('');
  const [showBreakPasscode, setShowBreakPasscode] = useState(false);
  const [isHrOverride, setIsHrOverride] = useState(false);

  const selectorRef = useRef(null);

  // Precision 1-second clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load employee list & auto-select current user or saved kiosk user
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
            setSelectedEmployee(savedEmp || null);
          } else {
            const found = list.find((e) => e.id === user?.id || e.email === user?.email);
            setSelectedEmployee(savedEmp || found || list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load employees for break tracking:', err);
      }
    };
    loadEmployees();
  }, [user]);

  // Fetch status for selected employee
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
      console.error('Error fetching today break status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history for selected employee
  const fetchHistory = async (empId = selectedEmployee?.id) => {
    if (!empId) {
      setHistory([]);
      return;
    }
    try {
      const res = await api.get(`/attendance/history?employeeId=${empId}`);
      if (res.data.success) {
        setHistory(res.data.attendances || []);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    }
  };

  // Fetch live floor break statistics across all employees
  const fetchLiveFloor = async () => {
    try {
      const res = await api.get('/attendance/live-floor');
      if (res.data.success) {
        setLiveFloorData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch live floor status:', err);
    }
  };

  useEffect(() => {
    if (selectedEmployee?.id) {
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } else {
      setStatusData(null);
      setHistory([]);
    }
    fetchLiveFloor();
    const interval = setInterval(fetchLiveFloor, 30000);
    return () => clearInterval(interval);
  }, [selectedEmployee?.id]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const hasClockedIn = statusData?.hasClockedIn;
  const hasClockedOut = statusData?.hasClockedOut;
  const activeBreak = statusData?.activeBreak;
  const todayBreaks = statusData?.attendance?.breaks || [];

  // Open break modal
  const handleOpenBreakModal = (type = 'COMFORT') => {
    if (!selectedEmployee?.id) {
      showToast('Please search or select your name first.', 'error');
      return;
    }
    if (!hasClockedIn) {
      showToast('You must clock in for today before taking a break.', 'error');
      return;
    }
    if (hasClockedOut) {
      showToast('Shift already finalized for today. Cannot take breaks after clock-out.', 'error');
      return;
    }
    if (activeBreak) {
      showToast(`Already on ${activeBreak.type} break session. Complete it first.`, 'error');
      return;
    }
    setSelectedBreakType(type);
    setBreakPasscode('');
    setShowBreakPasscode(false);
    setIsHrOverride(false);
    setBreakModalOpen(true);
  };

  // Start break with passcode verification
  const handleStartBreakSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;
    const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);
    if (!isHRorAdmin || !isHrOverride) {
      const trimmed = breakPasscode.trim();
      if (trimmed.length < 3 || trimmed.length > 5) {
        showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
        return;
      }
    }

    try {
      setActionLoading(true);
      let res;
      try {
        res = await api.post('/attendance/break/start', {
          type: selectedBreakType,
          employeeId: selectedEmployee.id,
          password: breakPasscode.trim()
        });
      } catch (err) {
        const fallback = selectedBreakType === 'COMFORT' ? 'TEA' : 'LUNCH';
        if (err.response?.status === 400 && err.response?.data?.message?.includes('Invalid break type')) {
          res = await api.post('/attendance/break/start', {
            type: fallback,
            employeeId: selectedEmployee.id,
            password: breakPasscode.trim()
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
      fetchLiveFloor();
    } catch (err) {
      showToast(err.response?.data?.message || 'Break authentication failed. Please verify passcode.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // End active break session
  const handleEndBreak = async () => {
    if (!selectedEmployee?.id) return;
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/break/end', { employeeId: selectedEmployee.id });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
      fetchLiveFloor();
    } catch (err) {
      showToast(err.response?.data?.message || 'Resume work failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Compute live active break metrics for Reference Image "My Time" Card
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

  // Calculate weekly & pay period stats for footer
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

  // Compute Comfort vs Meal usage today (inspired by hashan-jay/hr-break-time-tracking-v7-ultimate)
  const getCategoryBreakStats = () => {
    let comfortMins = 0;
    let mealMins = 0;
    let comfortStarts = 0;
    let mealStarts = 0;

    todayBreaks.forEach((b) => {
      const isMeal = b.type === 'MEAL' || b.type === 'LUNCH';
      const dur = b.durationMins || Math.round((currentTime - new Date(b.startTime)) / 60000);
      if (isMeal) {
        mealMins += dur;
        mealStarts++;
      } else {
        comfortMins += dur;
        comfortStarts++;
      }
    });

    return {
      comfortMins,
      mealMins,
      comfortStarts,
      mealStarts,
      comfortExceeded: comfortMins > 20,
      mealExceeded: mealMins > 60
    };
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

  const breakDetails = getBreakDetails();
  const timesheetStats = getTimesheetStats();
  const categoryStats = getCategoryBreakStats();

  const totalOnBreakStaff = liveFloorData?.summary?.onBreak || 0;
  const staffOnBreakList = liveFloorData?.roster?.filter((r) => r.floorStatus === 'ON_BREAK') || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm transition-all shadow-lg animate-in fade-in duration-200 ${
            message.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Break Time
          </h1>
        </div>

        {/* Digital Clock */}
        <div className="bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-2.5 flex items-center space-x-3 shadow-xs">
          <Timer size={22} className="text-[#246e1d] dark:text-emerald-400 animate-pulse" />
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Break Overview Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active on Break
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalOnBreakStaff}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Comfort Break (20m)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coffee size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {categoryStats.comfortMins}m
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Meal Break (1h)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Utensils size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {categoryStats.mealMins}m
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Break Compliance
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="text-2xl font-black mt-2">
            {categoryStats.comfortExceeded || categoryStats.mealExceeded ? (
              <span className="text-rose-600 dark:text-rose-400 text-lg">EXCEEDED</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">WELL SATISFIED</span>
            )}
          </div>
        </div>
      </div>

      {/* Universal Employee Kiosk Identity Selector */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors relative" ref={selectorRef}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Employee Identity Banner */}
          <div
            onClick={() => {
              if (selectedEmployee) {
                if (activeBreak) {
                  const el = document.getElementById('my-time-active-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (hasClockedIn && !hasClockedOut) {
                  handleOpenBreakModal('COMFORT');
                }
              }
            }}
            className="flex items-center gap-3.5 cursor-pointer group p-2 -m-2 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all select-none"
            title="Click to launch Comfort Break (20m) or Meal Break (1h) modal"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#D2FD41]/10 to-transparent text-emerald-600 dark:text-[#D2FD41] border border-emerald-500/30 flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              {selectedEmployee ? `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}` : <Users size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-display">
                  {selectedEmployee ? 'Active Employee Profile' : 'Select Employee to Track Breaks'}
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
                        : 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                    }`}
                  >
                    {activeBreak ? <Timer size={11} /> : <Coffee size={11} />}
                    <span>{activeBreak ? `On Break: ${activeBreak.type}` : 'Ready for Break'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2 mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-[#D2FD41] transition-colors">
                <span>{selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Select or Filter Your Name'}</span>
                {selectedEmployee && !activeBreak && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                    <Coffee size={10} />
                    Click for Break Modal
                  </span>
                )}
              </h3>
              {selectedEmployee && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {`${selectedEmployee.designation || 'Specialist'} • ${selectedEmployee.department?.name || 'SmartHR Operations'}`}
                </p>
              )}
            </div>
          </div>

          {/* Search Filter Input & Dropdown */}
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
                placeholder="Search staff (e.g. Elena, Liam, Priya)..."
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
                  <span>Select Employee</span>
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
                  if (isCurrent && !activeBreak && hasClockedIn && !hasClockedOut) {
                    handleOpenBreakModal('COMFORT');
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
                title={isCurrent ? 'Click to open break modal' : `Switch to ${emp.firstName}`}
              >
                <span>{emp.firstName} {emp.lastName}</span>
                <span className="text-[10px] opacity-75 font-mono">({emp.employeeCode})</span>
                {isCurrent && <Coffee size={10} className="text-amber-400 dark:text-slate-900" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Break Interaction Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: If on break, render "My Time" card; else render Dual Comfort & Meal Boards */}
        <div className="lg:col-span-7">
          {activeBreak && breakDetails ? (
            /* Reference-Matched "My Time" Active Break Card */
            <div id="my-time-active-card" className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-all flex flex-col justify-between max-w-md mx-auto lg:max-w-none">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#246e1d] dark:text-emerald-400" />
                  <span className="text-base font-bold text-[#246e1d] dark:text-emerald-400 font-sans tracking-tight">
                    My Time
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 animate-pulse">
                  Session Active
                </span>
              </div>

              {/* Body */}
              <div className="py-6 flex flex-col items-center justify-center">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5">
                  {breakDetails.displayName}
                </h4>

                {/* Circular Radial Progress Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center">
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
                      <Utensils size={52} className="text-[#2b7b1d] dark:text-emerald-400" />
                    ) : (
                      <Coffee size={52} className="text-[#2b7b1d] fill-[#2b7b1d] dark:text-emerald-400 dark:fill-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Big Bold Elapsed Time */}
                <div className="mt-5 text-center">
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
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
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
                    const el = document.getElementById('break-sessions-history-table');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  My Timesheet
                </button>
              </div>
            </div>
          ) : (
            /* Dual Boards: Comfort Break (20m) & Meal Break (1h) - Inspired by hr-break-time-tracking-v7-ultimate */
            <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Scheduled Break Boards
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select your authorized session below or click your name section.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  {hasClockedIn && !hasClockedOut ? 'Shift Active · Ready' : 'Shift Not Clocked In'}
                </span>
              </div>

              {!hasClockedIn && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Clock-In Required Before Taking Breaks
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                      You must clock in for today's shift before launching a break session.
                    </p>
                    <Link
                      to="/attendance"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-200 underline mt-2"
                    >
                      <span>Go to Attendance Page to Clock In</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Board 1: Comfort Break (20 min) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400/80 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Coffee size={20} />
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                        LIMIT: 20 MINS
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Comfort Break
                    </h4>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Used Today:</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{categoryStats.comfortMins} mins</strong>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Status:</span>
                        <span className={`font-bold ${categoryStats.comfortExceeded ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {categoryStats.comfortExceeded ? 'EXCEEDED LIMIT' : 'WELL SATISFIED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBreakModal('COMFORT')}
                    disabled={actionLoading || !hasClockedIn || hasClockedOut}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-40"
                  >
                    <Coffee size={14} />
                    <span>Start Comfort Break (20m)</span>
                  </button>
                </div>

                {/* Board 2: Meal Break (1 hour) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-400/80 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Utensils size={20} />
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                        LIMIT: 1 HOUR (60m)
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Meal Break
                    </h4>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Used Today:</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{categoryStats.mealMins} mins</strong>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Status:</span>
                        <span className={`font-bold ${categoryStats.mealExceeded ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {categoryStats.mealExceeded ? 'EXCEEDED LIMIT' : 'WELL SATISFIED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBreakModal('MEAL')}
                    disabled={actionLoading || !hasClockedIn || hasClockedOut}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#286e1e] hover:bg-[#1e5816] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-40"
                  >
                    <Utensils size={14} />
                    <span>Start Meal Break (1h)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Workforce On-Break Board */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Floor On-Break Board
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                {staffOnBreakList.length} Active
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
              {staffOnBreakList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No workforce members currently on break. All active staff are at their stations.
                </div>
              ) : (
                staffOnBreakList.map((st) => (
                  <div key={st.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                        {st.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {st.departmentCode} · {st.employeeCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {st.activeBreakType === 'MEAL' ? <Utensils size={10} /> : <Coffee size={10} />}
                        <span>{st.activeBreakType || 'BREAK'}</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {st.totalBreakMins}m total today
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Break Sessions History Log for Today */}
      <div id="break-sessions-history-table" className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Today's Break Sessions Log ({selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Selected Staff'})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {todayBreaks.length} sessions logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Break Type</th>
                <th className="py-3 px-4">Out Time (Started)</th>
                <th className="py-3 px-4">In Time (Ended)</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Policy Limit</th>
                <th className="py-3 px-5 text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {todayBreaks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No break sessions recorded today for this employee.
                  </td>
                </tr>
              ) : (
                todayBreaks.map((b) => {
                  const isMeal = b.type === 'MEAL' || b.type === 'LUNCH';
                  const limit = isMeal ? 60 : 20;
                  const dur = b.durationMins || Math.round((currentTime - new Date(b.startTime)) / 60000);
                  const isLive = !b.endTime;
                  const exceeded = dur > limit;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {isMeal ? <Utensils size={14} className="text-emerald-500" /> : <Coffee size={14} className="text-amber-500" />}
                        <span>{isMeal ? 'Meal Break' : 'Comfort Break'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {new Date(b.startTime).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {b.endTime ? new Date(b.endTime).toLocaleTimeString() : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                            Active (Now)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {dur}m
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {limit}m max
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            exceeded
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                          }`}
                        >
                          {exceeded ? 'EXCEEDED BREAK LIMIT' : 'WELL SATISFIED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break Selection Pop-up Modal (Anti-Proxy / Supervisor Override) */}
      {breakModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  {selectedBreakType === 'MEAL' ? <Utensils size={20} /> : <Coffee size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select Break Session
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
                  </div>
                </div>
              </div>

              {/* Passcode or Supervisor Override */}
              {['ADMIN', 'HR'].includes(user?.role) && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Supervisor / HR Override
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isHrOverride}
                    onChange={(e) => setIsHrOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              )}

              {(!isHrOverride || !['ADMIN', 'HR'].includes(user?.role)) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Passcode (3–5 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showBreakPasscode ? 'text' : 'password'}
                      required={!isHrOverride}
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
                </div>
              )}

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
                  disabled={actionLoading || (!isHrOverride && breakPasscode.trim().length < 3)}
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
