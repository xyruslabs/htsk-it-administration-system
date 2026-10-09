import React from 'react';

export const SmartHRLogo = ({ className = "w-10 h-10", showText = false, textClassName = "text-base" }) => {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full overflow-visible">
          <defs>
            {/* High-vibrancy enterprise gradient */}
            <linearGradient id="shieldBorder" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>

            {/* Subtle glow / translucent backplate */}
            <linearGradient id="shieldFill" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="nodeCore" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Hexagonal Shield Background Body */}
          <path
            d="M32 5 L55 16 V34 C55 47 45 56 32 60 C19 56 9 47 9 34 V16 Z"
            fill="url(#shieldFill)"
          />

          {/* Bold Outer Hexagonal Shield Outline */}
          <path
            d="M32 5 L55 16 V34 C55 47 45 56 32 60 C19 56 9 47 9 34 V16 Z"
            stroke="url(#shieldBorder)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Thick Lattice Connecting Pathways (Bold & High Contrast) */}
          <path
            d="M32 20 L21 33 M32 20 L43 33 M21 33 L32 46 M43 33 L32 46 M21 33 L43 33"
            stroke="url(#shieldBorder)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Top Leader Node */}
          <circle cx="32" cy="20" r="4.5" fill="url(#nodeCore)" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Left Team Node */}
          <circle cx="21" cy="33" r="4" fill="url(#nodeCore)" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Right Team Node */}
          <circle cx="43" cy="33" r="4" fill="url(#nodeCore)" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Bottom Foundation Node */}
          <circle cx="32" cy="46" r="3.5" fill="url(#nodeCore)" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center select-none">
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
