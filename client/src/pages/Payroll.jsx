import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Banknote,
  Calculator,
  Calendar,
  CheckCircle,
  FileCheck,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Download
} from 'lucide-react';

export const Payroll = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payroll?month=${month}&year=${year}`);
      if (res.data.success) {
        setPayrolls(res.data.payrolls);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/payroll/generate', { month, year });
      showToast(res.data.message, 'success');
      fetchPayrolls();
    } catch (err) {
      showToast(err.response?.data?.message || 'Payroll generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.put(`/payroll/${id}/status`, { status });
      showToast(`Payroll status updated to ${status}`, 'success');
      fetchPayrolls();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const canManage = ['ADMIN', 'HR'].includes(user?.role);

  // Compute aggregate stats
  const totalPayout = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
  const totalDeductions = payrolls.reduce((acc, p) => acc + p.deductions, 0);

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Monthly Payroll Summary Generator</h2>
          <p className="text-sm text-slate-400 mt-1">
            Aggregates actual attendances, calculates unpaid leave deductions, and generates net settlement sheets.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
          >
            <Calculator size={16} />
            <span>{generating ? 'Calculating...' : 'Run Payroll Engine'}</span>
          </button>
        )}
      </div>

      {/* Control Bar & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Settlement Period
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {[...Array(12).keys()].map((m) => (
                  <option key={m + 1} value={m + 1}>
                    {new Date(0, m).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
          <Calendar size={28} className="text-slate-400" />
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Net Disbursement
            </span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-300 mt-1">For {payrolls.length} active employee statements</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Absence & Tax Deductions
            </span>
            <TrendingDown size={18} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-300 mt-1">Automated wage withholding</p>
        </div>
      </div>

      {/* Dense Payroll Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Banknote size={18} className="text-slate-400" />
            <h3 className="font-semibold text-white text-base">Payroll Verification Sheets</h3>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            {payrolls.length} verified records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0C1322] text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-4">Base Rate</th>
                <th className="py-3 px-4">Days Worked</th>
                <th className="py-3 px-4">Unpaid Leaves</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Audit Status</th>
                {canManage && <th className="py-3 px-5 text-right">Settlement Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No payroll summaries generated for this period. Click 'Run Payroll Engine' to calculate.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-medium text-white">
                        {p.employee?.firstName} {p.employee?.lastName}
                      </div>
                      <div className="text-xs text-slate-300 font-mono">
                        {p.employee?.employeeCode} • {p.employee?.department?.code}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      ${p.baseSalary.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-white">
                      {p.daysWorked} days
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-amber-400">
                      {p.unpaidLeaveDays} d
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-rose-400">
                      -${p.deductions.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-400">
                      ${p.netSalary.toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          p.status === 'PAID'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : p.status === 'APPROVED'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {canManage && (
                      <td className="py-3 px-5 text-right">
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusUpdate(p.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-medium cursor-pointer"
                          >
                            Authorize
                          </button>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStatusUpdate(p.id, 'PAID')}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-medium cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {p.status === 'PAID' && (
                          <span className="text-xs text-slate-300 flex items-center justify-end gap-1">
                            <CheckCircle size={12} className="text-emerald-400" /> Settled
                          </span>
                        )}
                      </td>
                    )}
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
