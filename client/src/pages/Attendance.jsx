import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

  const [statusData, setStatusData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
          {/* Employee Identity Name Section */}
          <div className="flex items-center gap-3.5 select-none">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#D2FD41]/10 to-transparent text-emerald-600 dark:text-[#D2FD41] border border-emerald-500/30 flex items-center justify-center font-black text-base shadow-sm">
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
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      hasClockedIn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                    }`}
                  >
                    <Clock size={11} />
                    <span>{hasClockedOut ? 'Clocked Out' : hasClockedIn ? 'Clocked In' : 'Not Clocked In'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2 mt-0.5">
                <span>{selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Select or Filter Your Name'}</span>
              </h3>
              {selectedEmployee && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {`${selectedEmployee.designation || 'Specialist'} • ${selectedEmployee.department?.name || 'SmartHR Operations'}`}
                </p>
              )}
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
                  setSelectedEmployee(emp);
                  sessionStorage.setItem('smarthr_selected_kiosk_emp', emp.id);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-slate-900 text-white dark:bg-[#D2FD41] dark:text-[#0A0E1A] font-bold shadow-xs ring-2 ring-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`Switch to ${emp.firstName}`}
              >
                <span>{emp.firstName} {emp.lastName}</span>
                <span className="text-[10px] opacity-75 font-mono">({emp.employeeCode})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Card */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daily Attendance
            </h2>
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

          {/* Card 2: Shift Productivity & Policy Summary (Links to dedicated Break Time) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Coffee size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Shift Productivity & Breaks
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                  Standard Shift
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-5">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span>Shift Schedule Window:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">09:00 — 17:30</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span>Comfort Break Policy:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">20 Mins Max</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span>Meal Break Policy:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1 Hour Max</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Break Tracking Engine:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    Dedicated Terminal
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/break-time"
                className="w-full py-3 px-4 rounded-xl bg-[#286e1e] hover:bg-[#1e5816] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <Coffee size={14} />
                <span>Go to Break Time →</span>
              </Link>
            </div>
          </div>
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
    </div>
  );
};

