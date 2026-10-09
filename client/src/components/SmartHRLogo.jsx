import React from 'react';

export const SmartHRLogo = ({ className = "w-9 h-9", showText = false, textClassName = "text-base" }) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="nodeGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#10B981" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Outer Hexagonal Enterprise Shield */}
          <path
            d="M24 4 L41 12 V26 C41 35 33 42 24 45 C15 42 7 35 7 26 V12 Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#glow)"
          />

          {/* Top Leader Node */}
          <circle cx="24" cy="16" r="3" fill="url(#nodeGrad)" />

          {/* Left Team Member Node */}
          <circle cx="16" cy="27" r="2.8" fill="url(#nodeGrad)" />

          {/* Right Team Member Node */}
          <circle cx="32" cy="27" r="2.8" fill="url(#nodeGrad)" />

          {/* Bottom Core Hub Node */}
          <circle cx="24" cy="35" r="2.2" fill="url(#nodeGrad)" />

          {/* Interconnected Lattice Pathways (Neural Workforce Web) */}
          <path
            d="M24 19 L16 27 M24 19 L32 27 M16 27 L24 35 M32 27 L24 35 M16 27 L32 27"
            stroke="url(#shieldGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Inner Dynamic Biometric Curve */}
          <path
            d="M19 14 C21 12 27 12 29 14"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center">
          <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${textClassName}`}>
            Smart
          </span>
          <span className={`font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent ${textClassName}`}>
            HR
          </span>
        </div>
      )}
    </div>
  );
};

export default SmartHRLogo;
