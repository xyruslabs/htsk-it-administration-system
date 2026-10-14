import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, SkipForward, X, Download, Users, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../api/axios';

// ─── Toast helper ──────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const colors = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500'
  };
  return (
    <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${colors[toast.type] || colors.info}`}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {toast.message}
    </div>
  );
};

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    ready: { label: 'Ready',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    skip:  { label: 'Skip',   cls: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
    error: { label: 'Error',  cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400'    }
  };
  const { label, cls } = map[status] || map.error;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
};

// ─── Download sample template ──────────────────────────────────────────────────
const downloadTemplate = () => {
  const rows = [
    ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Designation', 'Department', 'Password'],
    ['Sarah',      'Vance',     'sarah.vance@company.com',   '+94771234567', 'EMPLOYEE', 'Data Analyst',      'Data Analyst employees',    '1234'],
    ['Marcus',     'Sterling',  'marcus.sterling@company.com','+94779876543', 'MANAGER',  'Risk Lead',         'Risk analyst employees',    'abc1'],
    ['Priya',      'Nair',      'priya.nair@company.com',    '+94712345678', 'EMPLOYEE', 'Finance Officer',   'Finance employees',         '5678'],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'SmartHR_Employee_Import_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function ImportEmployees() {
  const fileRef   = useRef(null);
  const [step, setStep]         = useState('upload');   // upload | preview | done
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Handle file selection ───────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      showToast('Please upload an Excel file (.xlsx or .xls)', 'error');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Step 1: Upload & Preview ────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) { showToast('Please select a file first.', 'error'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/import/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data.preview);
      setSummary(res.data.summary);
      setStep('preview');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to parse file.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm Import ──────────────────────────────────────────────────
  const handleConfirm = async () => {
    const readyRows = preview.filter(r => r.status === 'ready');
    if (!readyRows.length) { showToast('No valid rows to import.', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/import/confirm', { rows: readyRows });
      setResult(res.data);
      setStep('done');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Import failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview([]);
    setSummary(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080E1A] p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span>Employees</span>
          <ChevronRight size={12} />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">Import from Excel</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              📥 Import Employees
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload an Excel file — system will parse, validate, and bulk-register employees.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Download size={14} />
            Download Template
          </button>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { key: 'upload',  label: '1. Upload File' },
          { key: 'preview', label: '2. Review Data'  },
          { key: 'done',    label: '3. Done'         }
        ].map((s, i, arr) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${
              step === s.key
                ? 'bg-emerald-500 text-white'
                : ['done', 'preview'].includes(step) && s.key === 'upload'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : step === 'done' && s.key === 'preview'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {s.label}
            </div>
            {i < arr.length - 1 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 1 — UPLOAD
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'upload' && (
        <div className="max-w-2xl mx-auto">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1424] hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-emerald-600" />
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  Drop your Excel file here
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse — .xlsx, .xls supported</p>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Upload size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">Select File</span>
            </div>
          </div>

          {/* Column guide */}
          <div className="mt-6 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Expected Columns</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Designation', 'Department', 'Password'].map(col => (
                <span key={col} className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-center">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              ✓ Column order doesn't matter &nbsp;·&nbsp; ✓ Missing columns auto-filled &nbsp;·&nbsp; ✓ Duplicates auto-skipped
            </p>
          </div>

          <button
            onClick={handlePreview}
            disabled={!file || loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            {loading ? 'Parsing file...' : 'Parse & Preview →'}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 2 — PREVIEW
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'preview' && summary && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Rows',  value: summary.total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-white dark:bg-[#0D1424]' },
              { label: 'Ready',       value: summary.ready, color: 'text-emerald-600',                   bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Skipped',     value: summary.skip,  color: 'text-amber-600',                     bg: 'bg-amber-50  dark:bg-amber-900/20'  },
              { label: 'Errors',      value: summary.errors,color: 'text-red-600',                       bg: 'bg-red-50    dark:bg-red-900/20'    },
            ].map(card => (
              <div key={card.label} className={`${card.bg} border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center`}>
                <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Preview — {preview.length} rows detected</p>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 transition">
                <X size={12} /> Change file
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    {['Row', 'Status', 'Code', 'Name', 'Email', 'Role', 'Designation', 'Department', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {preview.map((row) => (
                    <tr key={row._rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono">{row._rowIndex}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{row.employeeCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.role === 'HR' || row.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : row.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>{row.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.designation || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.department || '—'}</td>
                      <td className="px-4 py-3 max-w-xs">
                        {row.errors.length > 0 && (
                          <div className="text-red-500 text-[10px]">{row.errors.join(', ')}</div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="text-amber-500 text-[10px]">{row.warnings.join(' · ')}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={15} /> Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || summary.ready === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition"
            >
              {loading
                ? <><RefreshCw size={15} className="animate-spin" /> Importing...</>
                : <><Users size={15} /> Confirm Import {summary.ready} Employee{summary.ready !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 3 — DONE
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'done' && result && (
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl p-10">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Import Complete!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{result.message}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <p className="text-2xl font-extrabold text-emerald-600">{result.imported}</p>
                <p className="text-xs text-slate-500 mt-1">Added</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <p className="text-2xl font-extrabold text-amber-600">{result.skipped}</p>
                <p className="text-xs text-slate-500 mt-1">Skipped</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <p className="text-2xl font-extrabold text-red-600">{result.failed?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Failed</p>
              </div>
            </div>

            {result.failed?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-red-600 mb-2">Failed Rows:</p>
                {result.failed.map((f, i) => (
                  <p key={i} className="text-[11px] text-red-500">{f.email}: {f.error}</p>
                ))}
              </div>
            )}

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
            >
              <Upload size={15} /> Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
