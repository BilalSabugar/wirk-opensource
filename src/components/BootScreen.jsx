import React, { useState, useEffect } from 'react';
import WirkLogo from './WirkLogo';

const STAGES = [
  { progress: 18,  label: 'Calibrating workspace runtime' },
  { progress: 48,  label: 'Synchronizing encrypted telemetry' },
  { progress: 82,  label: 'Arming Hermes executive intelligence' },
  { progress: 100, label: 'Workspace ready' },
];

export default function BootScreen() {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Smooth entrance trigger
    const mTimer = setTimeout(() => setMounted(true), 40);

    // Progressive stage transitions
    const timers = [
      setTimeout(() => { setStageIdx(0); setProgress(22); }, 150),
      setTimeout(() => { setStageIdx(1); setProgress(54); }, 650),
      setTimeout(() => { setStageIdx(2); setProgress(88); }, 1250),
      setTimeout(() => { setStageIdx(3); setProgress(100); }, 1800),
    ];

    return () => {
      clearTimeout(mTimer);
      timers.forEach(clearTimeout);
    };
  }, []);

  const currentStage = STAGES[stageIdx] || STAGES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden transition-opacity duration-700"
      style={{
        background: '#000000',
        color: '#FFFFFF',
      }}
    >
      {/* ── 1. AMBIENT LUXURY ILLUMINATION (Apple / Flagship Glow) ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: mounted ? 1 : 0,
          background: 'radial-gradient(circle at 50% 42%, rgba(255, 149, 0, 0.11) 0%, rgba(255, 59, 48, 0.04) 36%, rgba(0, 0, 0, 0) 70%)',
        }}
      />

      {/* Subtle top subtle rim lighting */}
      <div className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />

      {/* ── 2. CENTER PIECE: THE WIRK EMBLEM & TYPOGRAPHY ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center -mt-8 relative z-10 transition-all duration-1000 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        }}
      >
        {/* Flagship Emblem with breathing aura */}
        <div className="relative flex items-center justify-center mb-7 group">
          {/* Ambient Phosphor Backing */}
          <div
            className="absolute -inset-4 rounded-full blur-2xl opacity-60 animate-pulse transition-opacity duration-700"
            style={{
              background: 'radial-gradient(circle, rgba(255, 149, 0, 0.35) 0%, rgba(255, 59, 48, 0.15) 60%, transparent 100%)',
            }}
          />

          {/* Luxury Framed Emblem */}
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center p-3 shadow-2xl backdrop-blur-2xl transition-transform duration-500 group-hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, rgba(28, 28, 32, 0.8) 0%, rgba(10, 10, 12, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 149, 0, 0.12)',
            }}
          >
            <WirkLogo size={52} variant="default" glow={true} />
          </div>
        </div>

        {/* Wordmark Hierarchy */}
        <div className="text-center space-y-2">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-[0.24em] uppercase text-white"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.15)',
            }}
          >
            WIRK
          </h1>

          <p
            className="text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase text-zinc-400"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Turn intent into execution
          </p>
        </div>

        {/* ── 3. PRECISION LIQUID PROGRESS BAR ── */}
        <div className="mt-12 flex flex-col items-center gap-3 w-56 sm:w-64">
          {/* Track */}
          <div
            className="w-full h-[3px] rounded-full overflow-hidden relative"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
          >
            {/* Smooth liquid fill */}
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF3B30 0%, #FF9500 50%, #FFCC00 100%)',
                boxShadow: '0 0 12px rgba(255, 149, 0, 0.7)',
              }}
            />
          </div>

          {/* Dynamic Status Text with subtle fade */}
          <div className="h-5 flex items-center justify-center">
            <span
              key={currentStage.label}
              className="text-[10px] tracking-wider font-mono text-zinc-500 animate-fade-in transition-colors duration-300"
            >
              {currentStage.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. FOOTER EXECUTIVE METADATA ── */}
      <div
        className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-600 relative z-10 transition-opacity duration-1000"
        style={{ opacity: mounted ? 0.8 : 0 }}
      >
        <span>HERMES OS v6.0</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          SYSTEM SECURE
        </span>
      </div>
    </div>
  );
}
