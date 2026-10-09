import React from 'react';
import emblemImg from '../assets/smarthr_badge.png';

export const SmartHRLogo = ({ 
  className = "w-9 h-9", 
  showText = false, 
  textSize = "text-base",
  textClassName = "",
  showBadge = false,
  badgeText = "v2.6 Pro"
}) => {
  const fontClass = textClassName || textSize;
  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      {/* High-Resolution Emblem */}
      <img
        src={emblemImg}
        alt="SmartHR Logo"
        className={`${className} object-contain rounded-xl shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/20 transform transition-transform duration-200 hover:scale-105 shrink-0`}
      />

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className={fontClass}>
              Smart<span className="text-emerald-500 font-extrabold">HR</span>
            </span>
            {showBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-tight">
            Enterprise Workforce
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartHRLogo;
