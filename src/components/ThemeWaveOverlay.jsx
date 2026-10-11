import React, { useEffect } from 'react';

/**
 * ThemeWaveOverlay — Telegram-inspired Radial Wave + Gaussian Blur + Procedural Film Grain
 * 
 * Creates a soothing, tactile wave that sweeps outward from the user's click coordinates
 * when toggling between Dark and Light mode.
 */
export default function ThemeWaveOverlay({ wave, onComplete }) {
  useEffect(() => {
    if (!wave) return;
    const timer = setTimeout(() => {
      onComplete?.();
    }, 450);
    return () => clearTimeout(timer);
  }, [wave, onComplete]);

  if (!wave) return null;

  const { x, y, to } = wave;
  const isTargetDark = to === 'dark';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
    >
      {/* SVG Procedural Grain Noise Filter Definition */}
      <svg className="absolute w-0 h-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="wirk-theme-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.80"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 0 0.5  0 0 0 0.18 0"
              in="noise"
              result="grainAlpha"
            />
            <feBlend mode="overlay" in="SourceGraphic" in2="grainAlpha" />
          </filter>
        </defs>
      </svg>

      {/* ── Expanding Wavefront Layer ── */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          '--origin-x': `${x}px`,
          '--origin-y': `${y}px`,
          animation: 'wirkWaveSweep 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: isTargetDark
            ? 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(0, 0, 0, 0.25) 0%, rgba(12, 12, 14, 0.85) 60%, transparent 100%)'
            : 'radial-gradient(circle at var(--origin-x) var(--origin-y), rgba(255, 255, 255, 0.35) 0%, rgba(245, 245, 247, 0.90) 60%, transparent 100%)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        }}
      />

      {/* ── Procedural Film Grain Overlay (Sweeps with wave and evaporates) ── */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          '--origin-x': `${x}px`,
          '--origin-y': `${y}px`,
          animation: 'wirkGrainDissolve 450ms ease-out forwards',
          filter: 'url(#wirk-theme-grain)',
          background: isTargetDark ? '#000000' : '#FFFFFF',
        }}
      />

      {/* ── Radial Wavefront Perimeter Ring (Gleaming Edge) ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
          animation: 'wirkRingExpand 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          border: isTargetDark
            ? '1.5px solid rgba(255, 255, 255, 0.35)'
            : '1.5px solid rgba(0, 0, 0, 0.25)',
          boxShadow: isTargetDark
            ? '0 0 30px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
            : '0 0 30px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.05)',
        }}
      />
    </div>
  );
}
