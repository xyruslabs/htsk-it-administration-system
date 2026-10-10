import React, { useState, useEffect } from 'react';
import emblemImg from '../assets/smarthr_badge.png';

export const SplashScreen = ({ onFinish, duration = 2200 }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('initializing'); // 'initializing' | 'synced' | 'ready' | 'exit'
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Progress bar timing
    const intervalTime = 20;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Stage text transitions
    const t1 = setTimeout(() => setStage('synced'), duration * 0.45);
    const t2 = setTimeout(() => setStage('ready'), duration * 0.82);
    const t3 = setTimeout(() => setStage('exit'), duration * 0.94);
    const t4 = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, duration + 350);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStage('exit');
        setTimeout(() => {
          setIsVisible(false);
          if (onFinish) onFinish();
        }, 200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onFinish]);

  const handleSkip = () => {
    setStage('exit');
    setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      data-dark-contrast="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#060911] text-white select-none overflow-hidden transition-all duration-300 ease-out ${
        stage === 'exit'
          ? 'opacity-0 scale-[1.03] blur-xs pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Radial Spotlight (Pitch aesthetic) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-radial from-emerald-500/12 via-[#D2FD41]/5 to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Top Header Bar: Skip Button & Security Badge */}
      <div className="w-full px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D2FD41] animate-ping" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-semibold">
            SMARTHR OS // v2.6
          </span>
        </div>
        <button
          onClick={handleSkip}
          className="text-[11px] font-mono text-slate-400 hover:text-white px-3 py-1 rounded-full border border-white/10 hover:border-white/30 bg-white/5 transition cursor-pointer"
        >
          SKIP [ESC]
        </button>
      </div>

      {/* Centerpiece: Kinetic Geometric Logo Animation (Inspired by Pitch on Dribbble) */}
      <div className="relative flex flex-col items-center justify-center z-10 my-auto">
        {/* Kinetic Geometric Ring & Node Constellation */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
          {/* Animated SVG Orbiting Geometric Rings */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 160 160">
            {/* Outer dotted guide ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            {/* Animated drawing sweep arc */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#pitchGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="440"
              strokeDashoffset={440 - (440 * progress) / 100}
              className="transition-all duration-75 ease-linear"
            />
            {/* Linear gradients */}
            <defs>
              <linearGradient id="pitchGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#D2FD41" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Orbiting Satellite Node 1 */}
          <div
            className="absolute w-3 h-3 rounded-full bg-[#D2FD41] shadow-lg shadow-lime-400/50 pointer-events-none"
            style={{
              transform: `rotate(${progress * 3.6}deg) translateY(-70px)`
            }}
          />

          {/* Orbiting Satellite Node 2 (Counter-phase) */}
          <div
            className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50 pointer-events-none"
            style={{
              transform: `rotate(${-progress * 3.6 + 180}deg) translateY(-70px)`
            }}
          />

          {/* Central Emblem Badge with Smooth Spring-Scale Entrance */}
          <div className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/20 via-white/5 to-transparent border border-white/15 shadow-2xl backdrop-blur-md flex items-center justify-center transform transition-transform duration-700 ease-out hover:scale-105">
            <img
              src={emblemImg}
              alt="SmartHR Emblem"
              className="w-full h-full object-contain rounded-xl drop-shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
            />
          </div>
        </div>

        {/* Brand Typographic Reveal with Tracking Easing */}
        <div className="mt-7 text-center">
          <h1
            className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-1 transition-all duration-700"
            style={{
              letterSpacing: progress > 50 ? '-0.02em' : '0.08em'
            }}
          >
            <span>Smart</span>
            <span className="text-[#D2FD41] drop-shadow-[0_0_12px_rgba(210,253,65,0.4)]">HR</span>
          </h1>

          <p className="mt-1.5 text-xs font-semibold tracking-wider uppercase text-slate-400 font-display">
            ENTERPRISE WORKFORCE SYSTEM
          </p>
        </div>

        {/* Dynamic Telemetry Status Ticker */}
        <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D2FD41] animate-pulse" />
          <span className="text-slate-300">
            {stage === 'initializing' && 'INITIALIZING WORKFORCE TELEMETRY...'}
            {stage === 'synced' && 'SYNCHRONIZING BIOMETRIC NODES...'}
            {(stage === 'ready' || stage === 'exit') && 'SYSTEM READY // LAUNCHING'}
          </span>
          <span className="text-slate-500 text-[11px] ml-1">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Bottom Progress Bar: Ultra-thin precision rail with Volt glow */}
      <div className="w-full max-w-md px-6 pb-8 z-10 flex flex-col items-center gap-2">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-[#D2FD41] to-emerald-400 rounded-full shadow-[0_0_12px_rgba(210,253,65,0.8)] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>SECURE TELEMETRY</span>
          <span>DINITHA ENTERPRISE</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
