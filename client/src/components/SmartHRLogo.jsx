import React from 'react';
import emblemImg from '../assets/smarthr_badge.png';

export const SmartHRLogo = ({ className = "w-10 h-10", showText = false, textClassName = "text-base" }) => {
  return (
    <div className="flex items-center gap-3 shrink-0 select-none">
      {/* High-Resolution Concept 2 Connected Shield Badge */}
      <img
        src={emblemImg}
        alt="SmartHR Logo"
        className={`${className} object-contain rounded-xl shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30 transform transition-transform duration-200 hover:scale-105 shrink-0`}
      />

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
