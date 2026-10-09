import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  FileText,
  AlertCircle,
  Filter,
  UserCheck
} from 'lucide-react';

export const LeaveManagement = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, req: null, action: '', notes: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes] = await Promise.all([
        api.get('/leaves/balances'),
        api.get('/leaves/requests')
      ]);

      if (balRes.data.success) setBalances(balRes.data.balances);
      if (reqRes.data.success) setRequests(reqRes.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/leaves/apply', {
        leaveType,
        startDate,
        endDate,
        daysCount,
        reason
      });
      showToast(res.data.message, 'success');
      setModalOpen(false);
      // Reset form
      setReason('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave application', 'error');
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal.req) return;
    try {
      const res = await api.put(`/leaves/review/${reviewModal.req.id}`, {
        status: reviewModal.action,
        reviewNotes: reviewModal.notes
      });
      showToast(res.data.message, 'success');
      setReviewModal({ open: false, req: null, action: '', notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review request', 'error');
    }
  };

  const canApprove = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Leave Management Lifecycle</h2>
          <p className="text-sm text-slate-400 mt-1">
            Policy-based allocations, quota deductions, and manager approval audit trails.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/50 transition cursor-pointer"
        >
          <PlusCircle size={16} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Quota Balances Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const remaining = Math.max(0, b.allocated - b.used);
          const percentUsed = Math.round((b.used / b.allocated) * 100) || 0;
          return (
            <div key={b.id} className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {b.leaveType} LEAVE
                </span>
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  {remaining}d left
                </span>
              </div>

              <div className="text-3xl font-bold text-white mt-2">
                {remaining} <span className="text-sm font-normal text-slate-400">/ {b.allocated}d</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentUsed}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5 flex justify-between">
                <span>Used: {b.used} days</span>
                <span>Year: {b.year}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Requests Log */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-slate-400" />
            <h3 className="font-semibold text-white text-base">
              {canApprove ? 'Leave Applications & Approval Workflow' : 'My Leave Requests'}
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            {requests.length} applications total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0C1322] text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Applicant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason / Justification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Approval Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isPending = r.status === 'PENDING';
                  return (
                    <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-medium text-white">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </div>
                        <div className="text-xs text-slate-300 font-mono">
                          {r.employee?.employeeCode}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {r.leaveType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-300">
                        {new Date(r.startDate).toLocaleDateString()} &rarr;{' '}
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-white font-mono">
                        {r.daysCount} d
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">
                        {r.reason}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        {isPending && canApprove ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  req: r,
                                  action: 'APPROVED',
                                  notes: 'Approved without reservations.'
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  req: r,
                                  action: 'REJECTED',
                                  notes: 'Requires project schedule adjustment.'
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300">
                            {r.approver
                              ? `Reviewed by ${r.approver.firstName}`
                              : isPending
                              ? 'Awaiting review'
                              : 'Finalized'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Leave Application */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Apply for Leave Request</h3>
            <p className="text-xs text-slate-400">
              Allocated quota will be deducted automatically upon manager authorization.
            </p>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Leave Category
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ANNUAL">Annual Paid Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="CASUAL">Casual Personal Leave</option>
                  <option value="UNPAID">Unpaid Leave of Absence</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Days Count
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason & Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain purpose of leave..."
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review & Decision Audit */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-400" />
              <span>Confirm {reviewModal.action} Decision</span>
            </h3>
            <p className="text-xs text-slate-400">
              Applicant: {reviewModal.req?.employee?.firstName} {reviewModal.req?.employee?.lastName} (
              {reviewModal.req?.daysCount} days {reviewModal.req?.leaveType})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Approver Audit Notes / Feedback
              </label>
              <textarea
                rows={3}
                value={reviewModal.notes}
                onChange={(e) => setReviewModal({ ...reviewModal, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, req: null, action: '', notes: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                className={`px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition cursor-pointer ${
                  reviewModal.action === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {reviewModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
