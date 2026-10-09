import React from 'react';

export const SmartHRLogo = ({ className = "w-10 h-10", textSize = "text-xl", showText = false }) => {
  return (
    <div className="flex items-center gap-3 shrink-0 select-none">
      {/* Signature SmartHR Gradient Emerald-Teal Emblem Badge */}
      <div
        className={`${className} rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center font-black text-white ${textSize} shadow-lg shadow-emerald-950/40 ring-1 ring-white/20 shrink-0 transform transition-transform hover:scale-105`}
      >
        S
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="font-bold text-base tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>
              Smart<span className="text-emerald-500 font-extrabold">HR</span>
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ENT
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise Workforce</p>
        </div>
      )}
    </div>
  );
};

export default SmartHRLogo;
