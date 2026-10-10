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
  X
} from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const [statusData, setStatusData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [breakType, setBreakType] = useState('LUNCH');
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
          // Default to logged-in user if found in list, else first active employee
          const found = list.find((e) => e.id === user?.id || e.email === user?.email);
          setSelectedEmployee(found || list[0]);
        }
      } catch (err) {
        console.error('Failed to load employee list', err);
      }
    };
    loadEmployees();
  }, [user]);

  const fetchTodayStatus = async (empId = selectedEmployee?.id) => {
    if (!empId) return;
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
    if (!empId) return;
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
    }
  }, [selectedEmployee?.id]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleClockIn = async () => {
    if (!selectedEmployee?.id) return;
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-in', { employeeId: selectedEmployee.id });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      fetchTodayStatus(selectedEmployee.id);
      fetchHistory(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock-in failed', 'error');
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

  const handleStartBreak = async () => {
    if (!selectedEmployee?.id) return;
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/break/start', { type: breakType, employeeId: selectedEmployee.id });
      showToast(`${res.data.message} (${selectedEmployee.firstName} ${selectedEmployee.lastName})`, 'success');
      fetchTodayStatus(selectedEmployee.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Break start failed', 'error');
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
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#D2FD41]/10 to-transparent text-emerald-600 dark:text-[#D2FD41] border border-emerald-500/30 flex items-center justify-center font-black text-base shadow-sm">
              {selectedEmployee ? `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}` : 'EM'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-display">
                  Active Employee Profile
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {selectedEmployee?.employeeCode || 'SHR-000'}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2 mt-0.5">
                <span>{selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Select Employee'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedEmployee?.designation || 'Specialist'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEmployee?.department?.name || 'SmartHR Operations'}</span>
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
          {employeesList.slice(0, 6).map((emp) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedEmployee?.id === emp.id
                  ? 'bg-slate-900 text-white dark:bg-[#D2FD41] dark:text-[#0A0E1A] font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{emp.firstName} {emp.lastName}</span>
              <span className="text-[10px] opacity-75 font-mono">({emp.employeeCode})</span>
            </button>
          ))}
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
                  onClick={handleClockIn}
                  disabled={actionLoading}
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

          {/* Card 2: Granular Break Session Engine */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Granular Break Engine
                </span>
                {activeBreak ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 animate-pulse">
                    On Break: {activeBreak.type}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    Idle / Working
                  </span>
                )}
              </div>

              {!activeBreak ? (
                <div className="space-y-3 mb-6">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Select Specific Break Category:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['LUNCH', 'TEA', 'EMERGENCY'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBreakType(type)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          breakType === type
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    * Concurrent break lock prevents starting overlapping sessions.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 mb-6 text-center">
                  <Coffee size={24} className="mx-auto text-amber-500 mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    Active Break Session: {activeBreak.type}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                    Started at: {new Date(activeBreak.startTime).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>

            <div>
              {!activeBreak ? (
                <button
                  onClick={handleStartBreak}
                  disabled={actionLoading || !hasClockedIn || hasClockedOut}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer disabled:opacity-40"
                >
                  <Coffee size={14} />
                  <span>Start {breakType} Break</span>
                </button>
              ) : (
                <button
                  onClick={handleEndBreak}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Play size={14} fill="white" />
                  <span>Resume Productive Work</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Log */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
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
    </div>
  );
};
