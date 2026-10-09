import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cake,
  Activity,
  ArrowUpRight,
  MoreVertical,
  Plus,
  Send,
  Building,
  UserCheck,
  ChevronDown,
  Download,
  Filter,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [floorData, setFloorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Today');
  const [wishesSent, setWishesSent] = useState({});

  // Quick Request Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTab, setRequestTab] = useState('LEAVE'); // 'LEAVE' | 'ATTENDANCE' | 'OVERTIME'
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  const todayStr = new Date().toISOString().split('T')[0];

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'ANNUAL',
    startDate: todayStr,
    endDate: todayStr,
    daysCount: 1,
    reason: ''
  });

  const [attendanceForm, setAttendanceForm] = useState({
    regDate: todayStr,
    regType: 'MISSED_CLOCK_IN',
    regTime: '09:00',
    regReason: ''
  });

  const [otForm, setOtForm] = useState({
    otDate: todayStr,
    otHours: 2,
    otProject: 'SmartHR System Upgrade',
    otReason: ''
  });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, floorRes] = await Promise.all([
        api.get('/admin/system-stats'),
        api.get('/attendance/live-floor')
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (floorRes.data.success) setFloorData(floorRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalEmployees = stats?.totalEmployees || 6;
  const onDuty = floorData?.summary?.activeOnDuty || 2;
  const onBreak = floorData?.summary?.onBreak || 1;
  const onLeave = floorData?.summary?.onLeave || 1;
  const absent = floorData?.summary?.lateOrAbsent || 2;

  const handleSendWish = (id) => {
    setWishesSent((prev) => ({ ...prev, [id]: true }));
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Metric', 'Value', 'Category'],
      ['Total Active Employees', totalEmployees, 'Staffing'],
      ['Present on Floor', onDuty + onBreak, 'Attendance'],
      ['On Duty Active', onDuty, 'Attendance'],
      ['On Break', onBreak, 'Attendance'],
      ['On Leave', onLeave, 'Absence'],
      ['Late or Absent', absent, 'Absence'],
      ['Floor Attendance Rate', `${Math.round(((onDuty + onBreak) / (totalEmployees || 1)) * 100)}%`, 'KPI'],
      ['Active Projects', '90 / 125', 'Operations'],
      ['Pending Leave Requests', stats?.pendingLeaves || 0, 'Human Resources'],
      ['Exported By', user?.name || 'Administrator', 'Audit'],
      ['Timestamp', new Date().toLocaleString(), 'Audit'],
      ['Organization', 'Dinitha Enterprise', 'System']
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartHR_Executive_Summary_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Executive report exported successfully (CSV)', 'success');
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/leaves/apply', {
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        daysCount: parseFloat(leaveForm.daysCount) || 1,
        reason: leaveForm.reason
      });
      showToast(res.data.message || 'Leave request submitted successfully!', 'success');
      setIsRequestModalOpen(false);
      setLeaveForm({
        leaveType: 'ANNUAL',
        startDate: todayStr,
        endDate: todayStr,
        daysCount: 1,
        reason: ''
      });
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      showToast('Attendance regularization request submitted to HR team for review', 'success');
      setIsRequestModalOpen(false);
      setSubmitting(false);
      setAttendanceForm({
        regDate: todayStr,
        regType: 'MISSED_CLOCK_IN',
        regTime: '09:00',
        regReason: ''
      });
    }, 600);
  };

  const handleSubmitOvertime = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      showToast('Overtime authorization request submitted for manager approval', 'success');
      setIsRequestModalOpen(false);
      setSubmitting(false);
      setOtForm({
        otDate: todayStr,
        otHours: 2,
        otProject: 'SmartHR System Upgrade',
        otReason: ''
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with WhiteBIT/Linear Tier High-Tech Design */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#D2FD41] text-[#0A0E1A] tracking-wider uppercase font-display shadow-2xs">
              EXECUTIVE HRMS PORTAL
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise Workforce &bull; SmartHR v2.6
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Welcome back, {user?.firstName || 'Adrian'} 👋
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            You have{' '}
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {stats?.pendingLeaves || 1} Pending Approvals
            </span>{' '}
            requiring action &{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {onDuty} Active Staff
            </span>{' '}
            on the work floor today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Filter Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            {['Today', 'This Week', 'This Month'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-display ${
                  timeFilter === period
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
            title="Export live floor metrics as CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#D2FD41] hover:bg-[#C0EC2E] text-[#0A0E1A] text-xs font-black shadow-sm transition cursor-pointer font-display tracking-tight"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Top 8 Quick Metric Cards with Geometric Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Attendance */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Floor Attendance</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              Live Today
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            {onDuty + onBreak} / {totalEmployees}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Present on floor</p>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center font-mono">
              <ArrowUpRight size={12} />
              {Math.round(((onDuty + onBreak) / (totalEmployees || 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* Metric 2: Total Projects */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Active Projects</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            90 / 125
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">72% delivery rate</p>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center font-mono">
              <ArrowUpRight size={12} /> +8%
            </span>
          </div>
        </div>

        {/* Metric 3: Total Clients */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Enterprise Clients</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              SaaS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            69 / 86
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Active accounts</p>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center font-mono">
              <ArrowUpRight size={12} /> +4
            </span>
          </div>
        </div>

        {/* Metric 4: Tasks Completed */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sprint Deliverables</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              Sprint
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            96 / 100
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tasks resolved</p>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center font-mono">
              <ArrowUpRight size={12} /> 96%
            </span>
          </div>
        </div>

        {/* Metric 5: Monthly Payroll */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Monthly Payroll</span>
            <DollarSign size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 font-display tracking-tight">
            $32,700
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Est. disbursements</p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Audited
            </span>
          </div>
        </div>

        {/* Metric 6: Operating Margin */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Operating Margin</span>
            <TrendingUp size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            $5,544
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">This week net</p>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center font-mono">
              <ArrowUpRight size={12} /> +14.2%
            </span>
          </div>
        </div>

        {/* Metric 7: Candidate Pipeline */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Candidate Talent</span>
            <Users size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            98
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">In interview pool</p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
              Active HR
            </span>
          </div>
        </div>

        {/* Metric 8: New Hires Onboarding */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">New Hires</span>
            <UserCheck size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white mt-2 font-display tracking-tight">
            45 / 48
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Q4 onboarding</p>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center font-mono">
              <ArrowUpRight size={12} /> 93.7%
            </span>
          </div>
        </div>
      </div>

      {/* Signature High-Impact Workforce Pulse & Real-Time Velocity Bento (WhiteBIT / Linear Tier) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Feature Card: Signature Volt Lime Card (Mirrors Reference Slide 4 'What is Crypto Lending') */}
        <div className="lg:col-span-5 bg-[#D2FD41] text-[#0A0E1A] rounded-3xl p-6 sm:p-7 shadow-sm border border-lime-300/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border border-lime-500/20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A0E1A] text-white text-[10px] font-extrabold font-display tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D2FD41] animate-pulse" />
              Live Operational Pulse
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-tight text-[#0A0E1A]">
              Floor Attendance & Biometric Velocity
            </h3>
            <p className="text-xs font-semibold text-[#0A0E1A]/80 mt-2 leading-relaxed">
              Automated smart-roster monitoring, RFID floor badge tracking, and instantaneous exception mitigation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
            <div className="bg-[#0A0E1A] text-white p-3.5 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                Present On Floor
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-[#D2FD41] mt-1 tracking-tight">
                {Math.round(((onDuty + onBreak) / (totalEmployees || 1)) * 100)}%
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">SLA Target: 90%</p>
            </div>

            <div className="bg-[#0A0E1A] text-white p-3.5 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                Break Compliance
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-white mt-1 tracking-tight">
                99.4%
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero drift logged</p>
            </div>
          </div>
        </div>

        {/* Right Feature Card: Deep Midnight Navy Card with Equalizer (Mirrors Reference Slide 4 'How it works') */}
        <div className="lg:col-span-7 bg-[#0A0E1A] dark:bg-[#10162A] text-white rounded-3xl p-6 sm:p-7 border border-[#1E2945] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D2FD41] font-display">
                  Real-Time Floor Frequency
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-white mt-0.5 tracking-tight">
                  Active Shift Velocity & Roster Load
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Feed
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Continuous live telemetry across all operational floors, meeting pods, and authorized break rooms.
            </p>

            {/* Signature Equalizer Bar Graph Visualization from Reference Slide 4 */}
            <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-end justify-between gap-1.5 h-20">
              {[28, 45, 68, 38, 92, 54, 78, 98, 42, 85, 62, 90, 72, 88, 52, 96].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    style={{ height: `${h}%` }}
                    className={`w-full rounded-full transition-all duration-500 ${
                      i % 3 === 0
                        ? 'bg-[#D2FD41]'
                        : i % 2 === 0
                        ? 'bg-emerald-400'
                        : 'bg-white/40'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 4 Large Clean Stats Strip from Reference Slide 4 (40+, 6, 600K $, 1 click) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 mt-5 border-t border-white/[0.08]">
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
                {totalEmployees}+
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Active Personnel</div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
                6
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Departments</div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-[#D2FD41] tracking-tight">
                99.9%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">System Uptime</div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
                1 Click
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-medium">HR Approval</div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Employee Status Breakdown & Attendance Gauge & Real-Time Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Employee Status Distribution */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Employee Status Distribution
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total active workforce: 154
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                154 Staff
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex my-4">
              <div style={{ width: '48%' }} className="bg-emerald-500" title="Fulltime (48%)"></div>
              <div style={{ width: '20%' }} className="bg-blue-500" title="Contract (20%)"></div>
              <div style={{ width: '22%' }} className="bg-amber-500" title="Probation (22%)"></div>
              <div style={{ width: '10%' }} className="bg-purple-500" title="WFH (10%)"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Fulltime (48%)
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  112
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Contract (20%)
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  26
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Probation (22%)
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  12
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    WFH (10%)
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  04
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs">
                ER
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Elena Rostova</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Top Performer of Month</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              99% Score
            </span>
          </div>
        </div>

        {/* Card 2: Attendance Radial Overview Gauge */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Gauge</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time floor presence</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              Live Feed
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            {/* Circular Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * ((onDuty + onBreak) / (totalEmployees || 1)))}
                  strokeLinecap="round"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * (onBreak / (totalEmployees || 1)))}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {onDuty + onBreak}
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  PRESENT
                </span>
              </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="w-full grid grid-cols-4 gap-2 text-center mt-3">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">On Duty</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onDuty}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Break</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onBreak}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Leave</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onLeave}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Absent</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{absent}</div>
              </div>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Floor Attendance Rate:{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-sm">
                {Math.round(((onDuty + onBreak) / (totalEmployees || 1)) * 100)}%
              </span>
            </span>
          </div>
        </div>

        {/* Card 3: Clock In/Out Real-Time Roster Feed */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clock-In / Out Feed</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Live floor updates today</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Today
              </span>
            </div>

            <div className="space-y-2.5 mt-3.5">
              {floorData?.roster?.slice(0, 4).map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{emp.designation}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        emp.floorStatus === 'ON_DUTY'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                          : emp.floorStatus === 'ON_BREAK'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {emp.floorStatus}
                    </span>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {emp.clockInTime
                        ? new Date(emp.clockInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <a
              href="/floor-monitor"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Floor Monitor</span>
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Projects Table & Todo / Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Enterprise Active Projects
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tracked hours and priority deliverables
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Q4 Deliverables
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Hours Logged</th>
                  <th className="py-3 px-4">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PRO-001
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    SmartHR Core Enterprise Portal
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="w-[80%] h-full bg-emerald-500"></div>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300">45 / 255 Hrs</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                      HIGH
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PRO-002
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Payroll & Statutory Compliance Engine
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="w-[50%] h-full bg-amber-500"></div>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300">30 / 180 Hrs</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                      MEDIUM
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PRO-003
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Live Floor Presence IoT Integration
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="w-[30%] h-full bg-blue-500"></div>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300">22 / 120 Hrs</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
                      LOW
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PRO-004
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    Automated Leave & Quota Ledger
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="w-[65%] h-full bg-emerald-500"></div>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300">40 / 140 Hrs</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                      HIGH
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Birthdays & Activity Feed */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cake size={16} className="text-amber-500" />
              <span>Team Birthdays</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              This Week
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                  AJ
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Andrew Jermia</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Today &bull; Senior iOS Engineer</p>
                </div>
              </div>
              <button
                onClick={() => handleSendWish('AJ')}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  wishesSent['AJ']
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                {wishesSent['AJ'] ? (
                  <>
                    <Check size={11} /> Sent
                  </>
                ) : (
                  <>
                    <Send size={11} /> Wish
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-bold flex items-center justify-center text-xs">
                  MZ
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Mary Zeen</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Tomorrow &bull; Product Designer</p>
                </div>
              </div>
              <button
                onClick={() => handleSendWish('MZ')}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  wishesSent['MZ']
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {wishesSent['MZ'] ? (
                  <>
                    <Check size={11} /> Sent
                  </>
                ) : (
                  <>
                    <Send size={11} /> Wish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage.text && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slideUp">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <p className="flex-1 leading-relaxed">{toastMessage.text}</p>
            <button
              onClick={() => setToastMessage({ text: '', type: '' })}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Quick New Request Modal (SmartHR Enterprise System) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Submit New Request
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SmartHR Enterprise Self-Service Workflow
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Request Type Selector Tabs */}
            <div className="px-6 pt-4 pb-2">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRequestTab('LEAVE')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                    requestTab === 'LEAVE'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Leave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestTab('ATTENDANCE')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                    requestTab === 'ATTENDANCE'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock size={13} />
                  <span>Missed Punch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestTab('OVERTIME')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                    requestTab === 'OVERTIME'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>Overtime</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Leave Request Form */}
            {requestTab === 'LEAVE' && (
              <form onSubmit={handleSubmitLeave} className="p-6 pt-3 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Leave Category
                  </label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                    required
                  >
                    <option value="ANNUAL">Annual Leave (Paid Vacation)</option>
                    <option value="CASUAL">Casual Leave (Short Notice)</option>
                    <option value="MEDICAL">Medical / Sick Leave</option>
                    <option value="MATERNITY">Maternity / Paternity Leave</option>
                    <option value="UNPAID">Unpaid Leave (Loss of Pay)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Days Requested
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={leaveForm.daysCount}
                    onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason & Handover Notes
                  </label>
                  <textarea
                    rows="3"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Provide justification or handover details for the manager..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Attendance Regularization (Missed Punch) */}
            {requestTab === 'ATTENDANCE' && (
              <form onSubmit={handleSubmitAttendance} className="p-6 pt-3 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Regularization Event
                  </label>
                  <select
                    value={attendanceForm.regType}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, regType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    required
                  >
                    <option value="MISSED_CLOCK_IN">Missed Clock-In (Forgot RFID / Biometric)</option>
                    <option value="MISSED_CLOCK_OUT">Missed Clock-Out (Early / Power Failure)</option>
                    <option value="EXTENDED_BREAK">Break Regularization (Client Meeting)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={attendanceForm.regDate}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, regDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Actual Time
                    </label>
                    <input
                      type="time"
                      value={attendanceForm.regTime}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, regTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason & Explanation
                  </label>
                  <textarea
                    rows="3"
                    value={attendanceForm.regReason}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, regReason: e.target.value })}
                    placeholder="Specify reason for missed badge swipe or manual adjustment..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Regularization'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Overtime Authorization */}
            {requestTab === 'OVERTIME' && (
              <form onSubmit={handleSubmitOvertime} className="p-6 pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={otForm.otDate}
                      onChange={(e) => setOtForm({ ...otForm, otDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={otForm.otHours}
                      onChange={(e) => setOtForm({ ...otForm, otHours: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Associated Project / Client
                  </label>
                  <input
                    type="text"
                    value={otForm.otProject}
                    onChange={(e) => setOtForm({ ...otForm, otProject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. SmartHR Core Platform Release"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deliverable / Justification
                  </label>
                  <textarea
                    rows="3"
                    value={otForm.otReason}
                    onChange={(e) => setOtForm({ ...otForm, otReason: e.target.value })}
                    placeholder="Explain deliverables and business justification for overtime..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Request Overtime'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

