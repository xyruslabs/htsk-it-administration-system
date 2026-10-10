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
  X
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

    if ((!isHRorAdmin || !isHrOverride) && (!formData.password || formData.password.trim() === '')) {
      setModalError('Security Verification Required: Please enter the employee’s password.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/attendance/manual', {
        employeeId: targetEmpId,
        date: formData.date,
        clockIn: formData.clockIn,
        clockOut: formData.clockOut,
        status: formData.status,
        notes: formData.notes || `Manual entry recorded by ${user?.name || user?.email}`,
        password: formData.password,
        isHrOverride: isHRorAdmin && isHrOverride
      });

      showToast(res.data.message || 'Attendance verified and recorded successfully!', 'success');
      setAttendanceModalOpen(false);
      fetchFloorStatus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record attendance';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
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
                    <td className="py-3 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                          {item.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
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

      {/* Anti-Proxy Security Manual Attendance Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Add Manual Attendance</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      Security Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify employee credentials to prevent proxy or unfaithful clock-ins.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message if Verification Fails */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              {/* Selected Employee Display or Selector */}
              {selectedStaff ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      {selectedStaff.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{selectedStaff.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedStaff.employeeCode} • {selectedStaff.designation} ({selectedStaff.departmentCode})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {selectedStaff.floorStatus}
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Employee
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {roster.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode} - {emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Anti-Proxy Password Security Shield Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Anti-Proxy Security Protection (No Buddy-Punching)
                    </h5>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed mt-0.5">
                      To prevent unauthorized or unfaithful attendance marking on behalf of a colleague, please verify identity by entering the employee's personal account password.
                    </p>
                  </div>
                </div>

                {isHRorAdmin && (
                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isHrOverride}
                        onChange={(e) => setIsHrOverride(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Authorized HR / Admin Override (Bypass employee password)</span>
                    </label>
                  </div>
                )}

                {(!isHRorAdmin || !isHrOverride) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Employee Account Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!isHrOverride}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter employee's personal password..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PRESENT">PRESENT (Standard)</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF DAY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clock-In Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.clockIn}
                    onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clock-Out Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formData.clockOut}
                    onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Field assignment, approved retroactive punch"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>{actionLoading ? 'Authenticating...' : 'Verify & Add Attendance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
