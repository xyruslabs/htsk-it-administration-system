import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  Activity,
  Server
} from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterResource, setFilterResource] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/admin/audit-logs'),
        api.get('/admin/system-stats')
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.logs);
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesResource = !filterResource || log.resource === filterResource;
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.user &&
        `${log.user.firstName} ${log.user.lastName} ${log.user.employeeCode}`
          .toLowerCase()
          .includes(search.toLowerCase()));
    return matchesResource && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Audit Trails & Security Compliance Hub
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Immutable Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of security logins, timekeeping modifications, payroll executions, and privilege changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* System Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Directory
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {stats?.totalEmployees ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Verified enterprise profiles</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Departments
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {stats?.totalDepartments ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Configured organizational units</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pending Leave Audits
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {stats?.pendingLeaves ?? '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Awaiting manager sign-off</p>
        </div>

        <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Security Logs Logged
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {logs.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Recent audit transactions</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, details, user..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['', 'AUTH', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'EMPLOYEE'].map((res) => (
            <button
              key={res}
              onClick={() => setFilterResource(res)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterResource === res
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {res === '' ? 'All Resources' : res}
            </button>
          ))}
        </div>
      </div>

      {/* Log Stream Table */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-5 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      {l.user ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {l.user.firstName} {l.user.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {l.user.employeeCode} ({l.user.role})
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">System Engine</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {l.resource}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {l.details}
                    </td>

                    <td className="py-3 px-5 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {l.ipAddress || '127.0.0.1'}
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
