import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Coffee,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Building,
  CalendarPlus,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  X,
  Timer,
  Utensils
} from 'lucide-react';

export const FloorMonitor = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Manual Attendance Modal State with Anti-Proxy Protection
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isHrOverride, setIsHrOverride] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const [modalError, setModalError] = useState('');

  // Break modal states
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakStaff, setBreakStaff] = useState(null);
  const [breakType, setBreakType] = useState('COMFORT'); // 'COMFORT' (20m) | 'MEAL' (1h)
  const [breakPasscode, setBreakPasscode] = useState('');
  const [showBreakPasscode, setShowBreakPasscode] = useState(false);
  const [isHrBreakOverride, setIsHrBreakOverride] = useState(false);

  // Active Break Viewer modal state (matching reference image)
  const [activeBreakViewerOpen, setActiveBreakViewerOpen] = useState(false);
  const [activeViewerStaff, setActiveViewerStaff] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:00',
    clockOut: '17:00',
    status: 'PRESENT',
    notes: '',
    password: ''
  });

  const fetchFloorStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/live-floor');
      if (res.data.success) {
        setData(res.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load live floor monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorStatus();
    // Poll floor activity every 30 seconds
    const interval = setInterval(fetchFloorStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const roster = data?.roster || [];

  const filteredRoster = roster.filter((item) => {
    const matchesFilter = filterStatus === 'ALL' || item.floorStatus === filterStatus;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase()) ||
      item.designation.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status, breakType) => {
    switch (status) {
      case 'ON_DUTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Active On Duty
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 animate-pulse">
            <Coffee size={12} />
            Break: {breakType || 'General'}
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Approved Leave
          </span>
        );
      case 'CLOCKED_OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Clocked Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Absent / Unreported
          </span>
        );
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);

  const handleOpenAddAttendance = (staff = null) => {
    setModalError('');
    setSelectedStaff(staff);
    setShowPassword(false);
    setIsHrOverride(false);
    const initialEmpId = staff ? staff.id : (roster[0]?.id || '');
    setFormData({
      employeeId: initialEmpId,
      date: new Date().toISOString().split('T')[0],
      clockIn: '08:00',
      clockOut: '17:00',
      status: 'PRESENT',
      notes: '',
      password: ''
    });
    setAttendanceModalOpen(true);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setModalError('');
    const targetEmpId = selectedStaff ? selectedStaff.id : formData.employeeId;
    if (!targetEmpId) {
      setModalError('Please select a staff member.');
      return;
    }

    if ((!isHRorAdmin || !isHrOverride)) {
      if (!formData.password || formData.password.trim() === '') {
        setModalError('Please enter the employee’s 3–5 character passcode.');
        return;
      }
      if (formData.password.trim().length < 3 || formData.password.trim().length > 5) {
        setModalError('Passcode must be between 3 and 5 characters or digits.');
        return;
      }
    }

    try {
      setActionLoading(true);
      const payload = {
        employeeId: targetEmpId,
        date: formData.date,
        clockIn: formData.clockIn,
        clockOut: formData.clockOut,
        status: formData.status,
        notes: formData.notes || `Manual entry recorded by ${user?.name || user?.email}`,
        password: formData.password,
        isHrOverride: isHRorAdmin && isHrOverride
      };

      let res;
      try {
        res = await api.post('/attendance/manual', payload);
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          res = await api.post('/attendance/record', payload);
        } else {
          throw postErr;
        }
      }

      showToast(res.data.message || 'Attendance verified and recorded successfully!', 'success');
      setAttendanceModalOpen(false);
      fetchFloorStatus();
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'Attendance endpoint not found on server. Please restart the backend server or run run-smarthr.bat to apply updated routes.'
        : (err.response?.data?.message || 'Failed to record attendance');
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmployeeRowClick = (item) => {
    if (item.floorStatus === 'ON_BREAK') {
      setActiveViewerStaff(item);
      setActiveBreakViewerOpen(true);
    } else if (item.floorStatus === 'ON_DUTY') {
      setBreakStaff(item);
      setBreakType('COMFORT');
      setBreakPasscode('');
      setShowBreakPasscode(false);
      setIsHrBreakOverride(false);
      setBreakModalOpen(true);
    } else {
      handleOpenAddAttendance(item);
    }
  };

  const handleStartBreakSubmit = async (e) => {
    e.preventDefault();
    if (!breakStaff) return;
    const isHRorAdmin = ['ADMIN', 'HR'].includes(user?.role);
    if (!isHRorAdmin || !isHrBreakOverride) {
      const trimmed = breakPasscode.trim();
      if (trimmed.length < 3 || trimmed.length > 5) {
        showToast('Passcode must be between 3 and 5 characters.', 'error');
        return;
      }
    }
    try {
      setActionLoading(true);
      let res;
      try {
        res = await api.post('/attendance/break/start', {
          type: breakType,
          employeeId: breakStaff.id,
          password: breakPasscode.trim()
        });
      } catch (err) {
        const fallback = breakType === 'COMFORT' ? 'TEA' : 'LUNCH';
        if (err.response?.status === 400 && err.response?.data?.message?.includes('Invalid break type')) {
          res = await api.post('/attendance/break/start', {
            type: fallback,
            employeeId: breakStaff.id,
            password: breakPasscode.trim()
          });
        } else {
          throw err;
        }
      }
      showToast(
        `${breakType === 'COMFORT' ? 'Comfort Break (20 min)' : 'Meal Break (1 hour)'} started for ${breakStaff.name}!`,
        'success'
      );
      setBreakModalOpen(false);
      setBreakPasscode('');
      fetchFloorStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start break session.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreakForViewer = async (staffId, staffName) => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/break/end', { employeeId: staffId });
      showToast(`${res.data.message} (${staffName})`, 'success');
      setActiveBreakViewerOpen(false);
      fetchFloorStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to end break session.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getViewerBreakDetails = (staff) => {
    if (!staff) return null;
    const isMeal = staff.activeBreakType === 'MEAL' || staff.activeBreakType === 'LUNCH';
    const targetMins = isMeal ? 60 : 20;
    const startMs = staff.activeBreakStartTime ? new Date(staff.activeBreakStartTime).getTime() : currentTime.getTime() - 240000;
    const elapsedSecs = Math.max(0, Math.floor((currentTime.getTime() - startMs) / 1000));
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const targetSecs = targetMins * 60;
    const percent = Math.min(100, Math.max(0, (elapsedSecs / targetSecs) * 100));

    const circumference = 427.25;
    const strokeDashoffset = circumference - (circumference * percent) / 100;
    const targetEndTime = new Date(startMs + targetMins * 60 * 1000);
    const isOverdue = elapsedMins > targetMins;

    const displayName = isMeal
      ? 'Meal Break'
      : (staff.activeBreakType === 'COFFEE' ? 'Coffee Break' : 'Comfort Break');

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

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage.text && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm transition-all shadow-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Live Floor Attendance Monitor
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time workforce presence, break locks, and floor status across departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Add Attendance Button in Header */}
          <button
            onClick={() => handleOpenAddAttendance(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Manually Add Attendance with Password Verification"
          >
            <CalendarPlus size={14} />
            <span>Add Attendance</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>

          <button
            onClick={fetchFloorStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Headcount
            </span>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {data?.summary?.totalStaff ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Active registered staff</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On Duty Now
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {data?.summary?.activeOnDuty ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Working productively</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On Break
            </span>
            <Coffee size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {data?.summary?.onBreak ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lunch, tea or pause</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On Leave / Absent
            </span>
            <Clock size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-200 mt-2">
            {(data?.summary?.onLeave ?? 0) + (data?.summary?.lateOrAbsent ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {data?.summary?.onLeave ?? 0} approved leaves
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ON_DUTY', 'ON_BREAK', 'ON_LEAVE', 'ABSENT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Dense Enterprise Data Grid */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Clock-In Timestamp</th>
                <th className="py-3 px-4">Break Time (Mins)</th>
                <th className="py-3 px-4 text-right">Work Mins Logged</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No workforce members match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td
                      className="py-3 px-5 cursor-pointer group select-none"
                      onClick={() => handleEmployeeRowClick(item)}
                      title={
                        item.floorStatus === 'ON_BREAK'
                          ? `Click to view active break timer for ${item.name}`
                          : item.floorStatus === 'ON_DUTY'
                          ? `Click to start Comfort (20m) or Meal (1h) break for ${item.name}`
                          : `Click to record shift attendance for ${item.name}`
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                          {item.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#D2FD41] transition-colors flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.floorStatus === 'ON_BREAK' ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-medium flex items-center gap-0.5 animate-pulse">
                                <Timer size={9} />
                                Active Break
                              </span>
                            ) : item.floorStatus === 'ON_DUTY' ? (
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium flex items-center gap-0.5">
                                <Coffee size={9} />
                                Take Break
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono text-[10px]">{item.employeeCode}</span>
                            <span>•</span>
                            <span>{item.designation}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono">
                        {item.departmentCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(item.floorStatus, item.activeBreakType)}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {item.clockInTime
                        ? new Date(item.clockInTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : '—'}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.totalBreakMins > 0 ? `${item.totalBreakMins}m` : '0m'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {item.totalWorkMins > 0 ? `${item.totalWorkMins}m` : '0m'}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleOpenAddAttendance(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        title={`Record verified attendance for ${item.name}`}
                      >
                        <CalendarPlus size={13} />
                        <span>Add Attendance</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Attendance Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Log Attendance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record shift hours and verify employee authentication.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Error Message if Verification Fails */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              {/* Employee Information */}
              {selectedStaff ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                      {selectedStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedStaff.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedStaff.employeeCode} · {selectedStaff.department}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {selectedStaff.floorStatus?.replace('_', ' ')}
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Employee
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  >
                    {roster.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.employeeCode} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Passcode Verification Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock size={12} className="text-slate-400" />
                    <span>Employee Passcode</span>
                    <span className="text-slate-400 font-normal">(3–5 characters)</span>
                  </label>
                  {isHRorAdmin && (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isHrOverride}
                        onChange={(e) => setIsHrOverride(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 dark:text-emerald-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Admin bypass</span>
                    </label>
                  )}
                </div>

                {(!isHRorAdmin || !isHrOverride) && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!isHrOverride}
                      minLength={3}
                      maxLength={5}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="3–5 characters or digits (e.g. 1234)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Enter 3–5 digits or characters to confirm identity.
                </p>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late Arrival</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Clock In
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.clockIn}
                    onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Clock Out <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={formData.clockOut}
                    onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Field assignment, approved manual shift"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Break Selection Modal (Anti-Proxy / HR Override) */}
      {breakModalOpen && breakStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  {breakType === 'MEAL' ? <Utensils size={20} /> : <Coffee size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select Break Session
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {breakStaff.name} ({breakStaff.employeeCode} · {breakStaff.department})
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
                    onClick={() => setBreakType('COMFORT')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      breakType === 'COMFORT'
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
                    onClick={() => setBreakType('MEAL')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      breakType === 'MEAL'
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

              {/* Passcode or HR Override */}
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
                    checked={isHrBreakOverride}
                    onChange={(e) => setIsHrBreakOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              )}

              {(!isHrBreakOverride || !['ADMIN', 'HR'].includes(user?.role)) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Employee Passcode (3–5 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showBreakPasscode ? 'text' : 'password'}
                      required={!isHrBreakOverride}
                      minLength={3}
                      maxLength={5}
                      autoFocus
                      value={breakPasscode}
                      onChange={(e) => setBreakPasscode(e.target.value)}
                      placeholder="Enter employee passcode (e.g. 1234)"
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
                  disabled={actionLoading || (!isHrBreakOverride && breakPasscode.trim().length < 3)}
                  className="px-4 py-2 rounded-xl bg-[#286e1e] hover:bg-[#1e5816] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {breakType === 'MEAL' ? <Utensils size={13} /> : <Coffee size={13} />}
                  <span>
                    {actionLoading
                      ? 'Starting Break...'
                      : `Start ${breakType === 'COMFORT' ? 'Comfort Break (20m)' : 'Meal Break (1h)'}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Break Viewer Modal - Matches Reference Image */}
      {activeBreakViewerOpen && activeViewerStaff && (() => {
        const details = getViewerBreakDetails(activeViewerStaff);
        if (!details) return null;
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#246e1d] dark:text-emerald-400" />
                  <span className="text-base font-bold text-[#246e1d] dark:text-emerald-400 font-sans tracking-tight">
                    My Time
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBreakViewerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Centered Body */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="text-center mb-1">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {details.displayName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeViewerStaff.name} ({activeViewerStaff.employeeCode})
                  </p>
                </div>

                {/* Circular Radial Progress Ring */}
                <div className="relative w-44 h-44 flex items-center justify-center my-3">
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
                      strokeDashoffset={details.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear dark:stroke-emerald-400"
                    />
                  </svg>

                  {/* Centered Break Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {details.isMeal ? (
                      <Utensils size={46} className="text-[#2b7b1d] dark:text-emerald-400" />
                    ) : (
                      <Coffee size={46} className="text-[#2b7b1d] fill-[#2b7b1d] dark:text-emerald-400 dark:fill-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Big Bold Elapsed Time */}
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-serif text-[#216a1b] dark:text-emerald-400 tracking-tight">
                    {details.elapsedMins} min
                  </div>
                  <div className="text-xs font-semibold text-[#216a1b] dark:text-emerald-400 mt-1">
                    {details.isOverdue ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        Target ended at {details.formattedTargetTime} (+{details.elapsedMins - details.targetMins}m over)
                      </span>
                    ) : (
                      <span>Break ends at {details.formattedTargetTime}</span>
                    )}
                  </div>
                </div>

                {/* Prominent Green End Break Button */}
                <button
                  type="button"
                  onClick={() => handleEndBreakForViewer(activeViewerStaff.id, activeViewerStaff.name)}
                  disabled={actionLoading}
                  className="mt-6 w-full py-3.5 px-6 rounded-full bg-[#286e1e] hover:bg-[#1e5816] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-xs"></span>
                  </span>
                  <span>End Break</span>
                </button>
              </div>

              {/* Footer Stats */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Breaks</div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                    {activeViewerStaff.totalBreakMins}m
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Net Work</div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                    {activeViewerStaff.totalWorkMins}m
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveBreakViewerOpen(false)}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
