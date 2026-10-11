import React from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * ARIA Flagship Brand Mark — "Autonomous Reasoning & Intelligence Agent"
 * 
 * Aesthetic Architecture:
 * - Sacred Geometric "A" Aperture: Mathematically harmonious, precision-beveled prism
 * - Liquid Champagne, Platinum & Ethereal Violet Spectrum: Luxury, soothing, addictive harmony
 * - Luminous Optical Singularity: Calm, meditative breathing focal nucleus
 * - Precision Astronomical Gyro Ring: Ultra-fine orbital halo with cardinal ticks
 * - Responsive Theme Harmony: High specular contrast across both Dark Obsidian & Luxury Light Porcelain
 */
export default function AriaLogo({
  size = 32,
  variant = 'default',
  glow = true,
  state = 'idle', // 'idle' | 'thinking' | 'speaking' | 'recording'
  className = '',
  style = {},
}) {
  const isMono = variant === 'monochrome';
  const idSuffix = React.useId().replace(/:/g, '');

  let isDark = true;
  try {
    const themeHook = useTheme();
    isDark = themeHook.isDark;
  } catch {
    isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;
  }

  const gradRing   = `aria-ring-${idSuffix}`;
  const gradLeft   = `aria-left-${idSuffix}`;
  const gradRight  = `aria-right-${idSuffix}`;
  const gradCross  = `aria-cross-${idSuffix}`;
  const gradCore   = `aria-core-${idSuffix}`;
  const filterGlow = `aria-glow-${idSuffix}`;
  const filterSoft = `aria-soft-${idSuffix}`;

  // State-specific responsive resonance
  const stateColor = 
    state === 'recording' ? '#FB7185' : // Soothing rose petal
    state === 'thinking'  ? '#FBBF24' : // Warm solar amber
    state === 'speaking'  ? '#818CF8' : null; // Twilight violet-indigo

  // Theme-tailored metallic specular colors
  const ringPrimary   = isMono ? 'currentColor' : (stateColor || (isDark ? '#FFFFFF' : '#B45309'));
  const ringSecondary = isMono ? 'currentColor' : (stateColor || (isDark ? '#F59E0B' : '#D97706'));
  const apexHighlight = isMono ? 'currentColor' : (stateColor || (isDark ? '#FFFFFF' : '#92400E'));
  const specularCore  = isDark ? '#FFFFFF' : '#FEF3C7';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none transition-transform duration-500 ${
        state === 'thinking' ? 'animate-pulse' : ''
      } ${className}`}
      style={style}
    >
      <defs>
        {/* Hypnotic Optical Glow Filter */}
        <filter id={filterGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={isDark ? "3.5" : "2"} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={filterSoft} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={isDark ? "7" : "4"} />
        </filter>

        {/* Outer Precision Gyro Halo Gradient */}
        <linearGradient id={gradRing} x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={ringPrimary} stopOpacity={isDark ? "0.45" : "0.75"} />
          <stop offset="50%"  stopColor={ringSecondary} stopOpacity={isDark ? "0.25" : "0.50"} />
          <stop offset="100%" stopColor={isMono ? 'currentColor' : (stateColor || '#8B5CF6')} stopOpacity={isDark ? "0.10" : "0.35"} />
        </linearGradient>

        {/* Left Prism Facet: Ascending Light Beam */}
        <linearGradient id={gradLeft} x1="26" y1="80" x2="50" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={isMono ? 'currentColor' : (stateColor || (isDark ? '#78350F' : '#92400E'))} stopOpacity="0.9" />
          <stop offset="45%"  stopColor={isMono ? 'currentColor' : (stateColor || '#F59E0B')} />
          <stop offset="85%"  stopColor={isMono ? 'currentColor' : (stateColor || (isDark ? '#FDE68A' : '#D97706'))} />
          <stop offset="100%" stopColor={apexHighlight} />
        </linearGradient>

        {/* Right Prism Facet: Counter-balanced Specular Beam */}
        <linearGradient id={gradRight} x1="74" y1="80" x2="50" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={isMono ? 'currentColor' : (stateColor || (isDark ? '#4C1D95' : '#7C2D12'))} stopOpacity="0.85" />
          <stop offset="40%"  stopColor={isMono ? 'currentColor' : (stateColor || (isDark ? '#D97706' : '#B45309'))} />
          <stop offset="80%"  stopColor={isMono ? 'currentColor' : (stateColor || '#FBBF24')} />
          <stop offset="100%" stopColor={apexHighlight} />
        </linearGradient>

        {/* Horizontal Quantum Bridge */}
        <linearGradient id={gradCross} x1="32" y1="60" x2="68" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={isMono ? 'currentColor' : (stateColor || '#F59E0B')} stopOpacity="0.75" />
          <stop offset="50%"  stopColor={specularCore} stopOpacity="0.95" />
          <stop offset="100%" stopColor={isMono ? 'currentColor' : (stateColor || (isDark ? '#D97706' : '#B45309'))} stopOpacity="0.75" />
        </linearGradient>

        {/* Radiant Luminous Singularity */}
        <radialGradient id={gradCore} cx="50" cy="48" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={specularCore} stopOpacity="1" />
          <stop offset="35%"  stopColor={isMono ? 'currentColor' : (stateColor || '#FDE68A')} stopOpacity={isDark ? "0.8" : "0.6"} />
          <stop offset="70%"  stopColor={isMono ? 'currentColor' : (stateColor || '#F59E0B')} stopOpacity={isDark ? "0.25" : "0.15"} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Atmospheric Ambient Glow */}
      {(glow || variant === 'glow') && (
        <circle
          cx="50"
          cy="48"
          r="30"
          fill={`url(#${gradCore})`}
          filter={`url(#${filterSoft})`}
          opacity={state === 'thinking' ? '0.75' : (isDark ? '0.35' : '0.20')}
          className="transition-opacity duration-700"
        />
      )}

      {/* Main Precision Optical Mark */}
      <g filter={glow ? `url(#${filterGlow})` : undefined}>
        {/* 1. Precision Gyro Orbital Ring */}
        <circle
          cx="50"
          cy="50"
          r="41"
          stroke={`url(#${gradRing})`}
          strokeWidth="1.25"
          opacity={isMono ? '0.3' : (isDark ? '0.55' : '0.80')}
        />

        {/* 2. Cardinal Precision Ticks (North, East, South, West) */}
        <line x1="50" y1="6"  x2="50" y2="11" stroke={`url(#${gradRing})`} strokeWidth="1.25" strokeLinecap="round" opacity={isDark ? "0.6" : "0.85"} />
        <line x1="50" y1="89" x2="50" y2="94" stroke={`url(#${gradRing})`} strokeWidth="1.25" strokeLinecap="round" opacity={isDark ? "0.6" : "0.85"} />
        <line x1="6"  y1="50" x2="11" y2="50" stroke={`url(#${gradRing})`} strokeWidth="1.25" strokeLinecap="round" opacity={isDark ? "0.6" : "0.85"} />
        <line x1="89" y1="50" x2="94" y2="50" stroke={`url(#${gradRing})`} strokeWidth="1.25" strokeLinecap="round" opacity={isDark ? "0.6" : "0.85"} />

        {/* 3. Left Facet of the "A" Monogram: Pure, crisp geometric beam */}
        <path
          d="M 50 18 L 26 78 C 25.5 79.2 26.8 80.5 28 80 C 33 78 40 76 43 76 L 49.2 59 L 50 18 Z"
          fill={`url(#${gradLeft})`}
          opacity="0.95"
        />

        {/* 4. Right Facet of the "A" Monogram: Symmetrical precision beam */}
        <path
          d="M 50 18 L 74 78 C 74.5 79.2 73.2 80.5 72 80 C 67 78 60 76 57 76 L 50.8 59 L 50 18 Z"
          fill={`url(#${gradRight})`}
          opacity="0.92"
        />

        {/* 5. Crystalline Cross-Bar Aperture */}
        <path
          d="M 36 61 C 42 59 58 59 64 61 C 60 65 40 65 36 61 Z"
          fill={`url(#${gradCross})`}
          opacity="0.9"
        />

        {/* 6. The Central Optical Nucleus (Pure Pearl Core) */}
        <circle
          cx="50"
          cy="46"
          r="6.5"
          fill={`url(#${gradCore})`}
        />
        <circle
          cx="50"
          cy="46"
          r="2.75"
          fill={specularCore}
          opacity={isMono ? '0.9' : '1'}
        />

        {/* 7. Precision Apex Crown Highlight */}
        <circle
          cx="50"
          cy="18.5"
          r="1.75"
          fill={apexHighlight}
          opacity="0.95"
        />
      </g>
    </svg>
  );
}
