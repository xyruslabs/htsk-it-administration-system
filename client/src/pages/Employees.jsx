import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  CalendarPlus,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

export const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'PENDING'
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Manual Attendance Modal State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedAttendanceEmp, setSelectedAttendanceEmp] = useState(null);
  const [showAttendancePassword, setShowAttendancePassword] = useState(false);
  const [isAttendanceHrOverride, setIsAttendanceHrOverride] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    clockIn: '09:00',
    clockOut: '17:30',
    status: 'PRESENT',
    notes: '',
    password: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Create Form State
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '1234',
    role: 'EMPLOYEE',
    designation: '',
    departmentId: '',
    phone: ''
  });

  // Edit Form State
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    password: '',
    currentPassword: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/departments')
      ]);

      if (empRes.data.success) setEmployees(empRes.data.employees);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
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
    setTimeout(() => setMessage({ text: '', type: '' }), 6000);
  };

  const formatApiError = (err, defaultMsg = 'Action failed') => {
    if (err.response?.status === 403) {
      return `HR Admin Access Required: Role '${user?.role || 'EMPLOYEE'}' lacks administrative privileges. Please log in as HR Manager (hr@smarthr.io) or Super Admin (admin@smarthr.io) to manage or approve staff.`;
    }
    return err.response?.data?.message || defaultMsg;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (formData.password && (formData.password.trim().length < 3 || formData.password.trim().length > 5)) {
      showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post('/employees', formData);
      showToast(res.data.message, 'success');
      setModalOpen(false);
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '1234',
        role: 'EMPLOYEE',
        designation: '',
        departmentId: '',
        phone: ''
      });
      fetchData();
    } catch (err) {
      showToast(formatApiError(err, 'Error registering employee'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = ['ADMIN', 'HR'].includes(user?.role);

  const canEditEmployee = (emp) => {
    return true; // Accessible in shared workforce portal (requires passcode verification)
  };

  const canLogAttendance = (emp) => {
    return true; // Accessible in shared workforce portal (requires passcode verification)
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setEditData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      designation: emp.designation,
      departmentId: emp.departmentId || '',
      password: '',
      currentPassword: ''
    });
    setEditModalOpen(true);
  };

  const handleOpenAttendance = (emp) => {
    if (!canLogAttendance(emp)) {
      showToast('Security Violation: You do not have permission to log attendance for another employee.', 'error');
      return;
    }
    setSelectedAttendanceEmp(emp);
    setShowAttendancePassword(false);
    setIsAttendanceHrOverride(false);
    setAttendanceData({
      date: new Date().toISOString().split('T')[0],
      clockIn: '09:00',
      clockOut: '17:30',
      status: 'PRESENT',
      notes: '',
      password: ''
    });
    setAttendanceModalOpen(true);
  };

  const handleManualAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAttendanceEmp) return;

    if ((!canManage || !isAttendanceHrOverride)) {
      if (!attendanceData.password || attendanceData.password.trim() === '') {
        showToast('Please enter the employee’s 3–5 character passcode.', 'error');
        return;
      }
      if (attendanceData.password.trim().length < 3 || attendanceData.password.trim().length > 5) {
        showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
        return;
      }
    }

    try {
      setActionLoading(true);
      const res = await api.post('/attendance/manual', {
        employeeId: selectedAttendanceEmp.id,
        date: attendanceData.date,
        clockIn: attendanceData.clockIn,
        clockOut: attendanceData.clockOut,
        status: attendanceData.status,
        notes: attendanceData.notes,
        password: attendanceData.password,
        isHrOverride: canManage && isAttendanceHrOverride
      });
      showToast(res.data.message || 'Attendance logged successfully', 'success');
      setAttendanceModalOpen(false);
      setSelectedAttendanceEmp(null);
    } catch (err) {
      showToast(formatApiError(err, 'Failed to record manual attendance'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (editData.password && editData.password.trim() !== '') {
      const trimmed = editData.password.trim();
      if (trimmed.length < 3 || trimmed.length > 5) {
        showToast('Passcode must be between 3 and 5 characters or digits.', 'error');
        return;
      }
    }
    try {
      setActionLoading(true);
      const res = await api.put(`/employees/${editingEmployee.id}`, editData);
      showToast(res.data.message, 'success');
      setEditModalOpen(false);
      setEditingEmployee(null);
      fetchData();
    } catch (err) {
      showToast(formatApiError(err, 'Failed to update employee details'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (empId, empName) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/employees/${empId}/approve`);
      showToast(res.data.message || `Approved ${empName}`, 'success');
      fetchData();
    } catch (err) {
      showToast(formatApiError(err, 'Failed to approve employee'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (empId, empName) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/employees/${empId}/reject`);
      showToast(res.data.message || `Rejected registration for ${empName}`, 'success');
      fetchData();
    } catch (err) {
      showToast(formatApiError(err, 'Failed to reject employee'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Group employees
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const pendingEmployees = employees.filter((e) => e.status === 'PENDING_APPROVAL');

  const currentList = activeTab === 'ACTIVE' ? activeEmployees : pendingEmployees;

  const filteredEmployees = currentList.filter((emp) => {
    const matchesDept = !selectedDept || emp.departmentId === selectedDept;
    const matchesSearch =
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm transition-all shadow-md ${
            message.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Employee Directory & Workforce Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse registered colleagues, update profile details, or register new employees with HR approval.
          </p>
        </div>

        {/* Register Employee Button - Accessible to all staff */}
        <button
          onClick={() => {
            setFormData({
              ...formData,
              employeeCode: `SHR-${100 + employees.length + 1}`
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>+ Register New Employee</span>
        </button>
      </div>

      {/* Status Tab Switcher: Registered vs Pending HR Approval */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-slate-900 text-white dark:bg-[#D2FD41] dark:text-[#0A0E1A] shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UserCheck size={14} />
          <span>Registered Active Staff</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/60 dark:bg-black/20 font-mono">
            {activeEmployees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock size={14} />
          <span>Pending HR Approvals</span>
          {pendingEmployees.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-300 font-mono font-black animate-pulse">
              {pendingEmployees.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending Notice Banner when on Pending Tab */}
      {activeTab === 'PENDING' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Pending Registration Approvals ({pendingEmployees.length})</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                New staff registrations remain unverified until approved by HR. Once approved, they will be registered and able to mark attendance.
              </p>
            </div>
          </div>
          {canManage && (
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 uppercase font-mono">
              HR Review Mode
            </span>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-56 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-[#0D1424] rounded-2xl border border-slate-200 dark:border-slate-800">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">
              {activeTab === 'ACTIVE'
                ? 'No registered employees matching filters'
                : 'No pending registration requests'}
            </p>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-[#0D1424] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-base shadow-xs">
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{emp.designation}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      emp.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        : emp.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 animate-pulse'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                    }`}
                  >
                    {emp.status === 'PENDING_APPROVAL' ? 'PENDING HR APPROVAL' : emp.status}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Building size={13} className="text-slate-400" />
                      <span>Department:</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{emp.department?.name || 'General'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Shield size={13} className="text-slate-400" />
                      <span>Role Access:</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">{emp.role}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Mail size={13} className="text-slate-400" />
                      <span>Work Email:</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate">{emp.email}</span>
                  </div>

                  {emp.phone && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Phone size={13} className="text-slate-400" />
                        <span>Contact:</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-400">ID: {emp.employeeCode}</span>

                <div className="flex items-center gap-1.5">
                  {/* HR Approval Controls if Pending */}
                  {emp.status === 'PENDING_APPROVAL' && canManage ? (
                    <>
                      <button
                        onClick={() => handleApprove(emp.id, `${emp.firstName} ${emp.lastName}`)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(emp.id, `${emp.firstName} ${emp.lastName}`)}
                        disabled={actionLoading}
                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : emp.status === 'PENDING_APPROVAL' ? (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock size={12} />
                      Awaiting HR
                    </span>
                  ) : null}

                  {/* Active Employee Actions: Add Attendance + Edit */}
                  {emp.status === 'ACTIVE' && (
                    <>
                      {/* Manually Add Attendance Button */}
                      {canLogAttendance(emp) && (
                        <button
                          onClick={() => handleOpenAttendance(emp)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Record Attendance Manually"
                        >
                          <CalendarPlus size={13} />
                          <span>+ Attendance</span>
                        </button>
                      )}

                      {/* Edit / Update Profile Button (Restricted to Admin, HR, or own profile) */}
                      {canEditEmployee(emp) ? (
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Update Profile Details"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <span
                          className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1 text-[11px]"
                          title="Protected: You do not have permission to modify another employee's profile"
                        >
                          <Lock size={12} />
                          <span>Protected</span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register New Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Employee</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {canManage
                    ? 'Initializes employee record and activates attendance profile.'
                    : 'Submits registration request for HR authorization.'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!canManage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Clock size={16} className="shrink-0 text-amber-500" />
                <span>
                  <strong>HR Approval Notice:</strong> Unapproved registrations cannot mark attendance until authorized by an HR Administrator.
                </span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={formData.role}
                    disabled={!canManage}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    {canManage && (
                      <>
                        <option value="MANAGER">Team Lead / Manager</option>
                        <option value="HR">HR Specialist</option>
                        <option value="ADMIN">Super Admin</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@smarthr.io"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Passcode (3–5 Characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={3}
                  maxLength={5}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="3–5 characters or digits (e.g. 1234)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Employee's security passcode for login and attendance verification.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : canManage ? 'Register & Activate' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Update Employee Details Modal */}
      {editModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Update Employee Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Updating profile for <strong className="text-slate-800 dark:text-slate-200">{editingEmployee.firstName} {editingEmployee.lastName}</strong> ({editingEmployee.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={editData.designation}
                  onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={editData.departmentId}
                  onChange={(e) => setEditData({ ...editData, departmentId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Passcode (3–5 Characters, Optional)
                </label>
                <input
                  type="password"
                  minLength={3}
                  maxLength={5}
                  value={editData.password || ''}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  placeholder="Leave blank to keep current passcode"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Enter 3–5 characters or digits to change employee passcode.
                </p>
              </div>

              {!canManage && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Verification Passcode (3–5 Characters) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={3}
                    maxLength={5}
                    value={editData.currentPassword || ''}
                    onChange={(e) => setEditData({ ...editData, currentPassword: e.target.value })}
                    placeholder="Enter this employee's 3–5 passcode"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Anti-tamper protection: Passcode required to save modifications to this profile.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {attendanceModalOpen && selectedAttendanceEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Log Attendance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record shift hours for team members.
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

            <form onSubmit={handleManualAttendanceSubmit} className="space-y-4">
              {/* Employee Summary Card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                    {selectedAttendanceEmp.firstName[0]}
                    {selectedAttendanceEmp.lastName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      {selectedAttendanceEmp.firstName} {selectedAttendanceEmp.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedAttendanceEmp.employeeCode} · {selectedAttendanceEmp.designation}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {selectedAttendanceEmp.department?.name || 'General'}
                </span>
              </div>

              {/* Passcode Verification Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock size={12} className="text-slate-400" />
                    <span>Employee Passcode</span>
                    <span className="text-slate-400 font-normal">(3–5 characters)</span>
                  </label>
                  {canManage && (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAttendanceHrOverride}
                        onChange={(e) => setIsAttendanceHrOverride(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 dark:text-emerald-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Admin bypass</span>
                    </label>
                  )}
                </div>

                {(!canManage || !isAttendanceHrOverride) && (
                  <div className="relative">
                    <input
                      type={showAttendancePassword ? 'text' : 'password'}
                      required={!isAttendanceHrOverride}
                      minLength={3}
                      maxLength={5}
                      value={attendanceData.password}
                      onChange={(e) => setAttendanceData({ ...attendanceData, password: e.target.value })}
                      placeholder="3–5 characters or digits (e.g. 1234)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAttendancePassword(!showAttendancePassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showAttendancePassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                    value={attendanceData.date}
                    onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={attendanceData.status}
                    onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late Arrival</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
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
                    value={attendanceData.clockIn}
                    onChange={(e) => setAttendanceData({ ...attendanceData, clockIn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Clock Out <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={attendanceData.clockOut}
                    onChange={(e) => setAttendanceData({ ...attendanceData, clockOut: e.target.value })}
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
                  value={attendanceData.notes}
                  onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                  placeholder="e.g. Field assignment, approved manual shift"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
                />
              </div>

              {/* Actions */}
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
    </div>
  );
};

export default Employees;
