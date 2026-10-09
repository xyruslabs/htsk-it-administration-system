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
  UserCheck
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [floorData, setFloorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    loadDashboardData();
  }, []);

  const totalEmployees = stats?.totalEmployees || 6;
  const onDuty = floorData?.summary?.activeOnDuty || 2;
  const onBreak = floorData?.summary?.onBreak || 1;
  const onLeave = floorData?.summary?.onLeave || 1;
  const absent = floorData?.summary?.lateOrAbsent || 2;

  return (
    <div className="space-y-6">
      {/* Welcome Banner matching design */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              EXECUTIVE VIEW
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dashboard &bull; Admin & HRMS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back, {user?.firstName || 'Adrian'} 👋
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            You have <span className="text-amber-600 dark:text-amber-400 font-bold">{stats?.pendingLeaves || 1} Pending Approvals</span> &{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{onDuty} Active Floor Operations</span> today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 shadow-sm transition cursor-pointer">
            <Calendar size={14} />
            <span>Add Schedule</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/20 transition cursor-pointer">
            <Plus size={14} />
            <span>Add Requests</span>
          </button>
        </div>
      </div>

      {/* Top 8 Quick Metric Cards from reference image */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Attendance Overview</span>
            <span className="text-emerald-400 text-[11px]">Today</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">
            {onDuty + onBreak} / {totalEmployees}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active floor presence</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Projects</span>
            <span className="text-blue-400 text-[11px]">Active</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">90 / 125</div>
          <p className="text-[11px] text-slate-400 mt-1">72% delivery rate</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Clients</span>
            <span className="text-purple-400 text-[11px]">SaaS</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">69 / 86</div>
          <p className="text-[11px] text-slate-400 mt-1">Enterprise accounts</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tasks Completed</span>
            <span className="text-amber-400 text-[11px]">Sprint</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">96 / 100</div>
          <p className="text-[11px] text-slate-400 mt-1">+12% vs last week</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Payroll Est.</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5 font-mono">$32,700</div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated disbursements</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Operating Profit</span>
            <TrendingUp size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">$5,544</div>
          <p className="text-[11px] text-slate-400 mt-1">This week margin</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Candidate Applicants</span>
            <Users size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">98</div>
          <p className="text-[11px] text-slate-400 mt-1">In interview pipeline</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>New Hires Onboarding</span>
            <UserCheck size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">45 / 48</div>
          <p className="text-[11px] text-slate-400 mt-1">Q4 intake cycle</p>
        </div>
      </div>

      {/* Middle Row: Employee Status Breakdown & Attendance Radial & Live Clock Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Employee Status */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Employee Status Distribution</h3>
            <span className="text-xs text-slate-400 font-mono">Total: 154</span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Fulltime (48%)</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">112</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Contract (20%)</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">26</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Probation (22%)</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">12</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">WFH Remote (20%)</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">04</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs">
                DE
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Elena Rostova</p>
                <p className="text-[10px] text-slate-400">Top Monthly Performer</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              99% Score
            </span>
          </div>
        </div>

        {/* Card 2: Attendance Radial Overview */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Overview Gauge</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Today
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            {/* Modern High-Contrast Multi-Colored Circular Gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Present Active Arc (Emerald) */}
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
                {/* Break Arc Overlay (Amber) */}
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

              {/* Center Metrics Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {onDuty + onBreak}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  PRESENT
                </span>
              </div>
            </div>

            {/* Metric Status Chips with High Contrast Badges */}
            <div className="w-full grid grid-cols-4 gap-2 text-center mt-4">
              <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">On Duty</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onDuty}</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Break</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onBreak}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Leave</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-sm mt-0.5">{onLeave}</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1"></div>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Absent</div>
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

        {/* Card 3: Clock In/Out Real-Time Floor Roster */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Clock-In / Out Feed</h3>
            <span className="text-xs text-slate-400">Today</span>
          </div>

          <div className="space-y-3 mt-4">
            {floorData?.roster?.slice(0, 4).map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.designation}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      emp.floorStatus === 'ON_DUTY'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : emp.floorStatus === 'ON_BREAK'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {emp.floorStatus}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {emp.clockInTime ? new Date(emp.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Projects Table & Todo / Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Table */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Enterprise Active Projects</h3>
            <span className="text-xs text-slate-400 font-mono">Q4 Deliverables</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C1322] text-slate-300 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Project Name</th>
                  <th className="py-2.5 px-4">Hours Logged</th>
                  <th className="py-2.5 px-4">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                <tr className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-4 text-emerald-400">PRO-001</td>
                  <td className="py-2.5 px-4 font-sans text-white">SmartHR Core Enterprise Portal</td>
                  <td className="py-2.5 px-4 text-slate-300">45 / 255 Hrs</td>
                  <td className="py-2.5 px-4"><span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">HIGH</span></td>
                </tr>
                <tr className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-4 text-emerald-400">PRO-002</td>
                  <td className="py-2.5 px-4 font-sans text-white">Payroll & Statutory Compliance Engine</td>
                  <td className="py-2.5 px-4 text-slate-300">30 / 180 Hrs</td>
                  <td className="py-2.5 px-4"><span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">MEDIUM</span></td>
                </tr>
                <tr className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-4 text-emerald-400">PRO-003</td>
                  <td className="py-2.5 px-4 font-sans text-white">Live Floor Presence IoT Integration</td>
                  <td className="py-2.5 px-4 text-slate-300">22 / 120 Hrs</td>
                  <td className="py-2.5 px-4"><span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">LOW</span></td>
                </tr>
                <tr className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-4 text-emerald-400">PRO-004</td>
                  <td className="py-2.5 px-4 font-sans text-white">Automated Leave & Quota Ledger</td>
                  <td className="py-2.5 px-4 text-slate-300">40 / 140 Hrs</td>
                  <td className="py-2.5 px-4"><span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">HIGH</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Birthdays & Activity Feed */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cake size={16} className="text-amber-400" />
              <span>Team Birthdays</span>
            </h3>
            <span className="text-xs text-slate-400">This Week</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Andrew Jermia</p>
                  <p className="text-[10px] text-slate-400">Today &bull; iOS Developer</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                <Send size={10} /> Send
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                  M
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Mary Zeen</p>
                  <p className="text-[10px] text-slate-400">Tomorrow &bull; UI/UX</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300">
                <Send size={10} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
