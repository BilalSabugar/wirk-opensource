import React from 'react';

/**
 * WIRK Brand Mark — "Workspace for Intent, Reflection and Kinetic Action"
 * 
 * Kinetic Monogram "W":
 * - Interlocking geometric precision chevrons representing Intent & Execution
 * - Dynamic kinetic gradient: Warm Solar Amber to Deep Gold
 * - Center Focal Core: Quantum reflection spark
 * - Smooth continuous curvature
 */
export default function WirkLogo({
  size = 32,
  variant = 'default', // 'default' | 'monochrome' | 'glow'
  glow = false,
  className = '',
  style = {},
}) {
  const isMono = variant === 'monochrome';
  const idSuffix = React.useId().replace(/:/g, '');

  const gradKinetic = `wirk-kinetic-${idSuffix}`;
  const gradCore    = `wirk-core-${idSuffix}`;
  const gradSheen   = `wirk-sheen-${idSuffix}`;
  const filterGlow  = `wirk-glow-${idSuffix}`;
  const filterSoft  = `wirk-soft-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 select-none ${className}`}
      style={style}
    >
      <defs>
        {/* Optical Glow Filter */}
        <filter id={filterGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={filterSoft} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Flagship WIRK Kinetic Gradient */}
        <linearGradient id={gradKinetic} x1="16" y1="20" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={isMono ? 'currentColor' : '#FDE68A'} />
          <stop offset="36%"  stopColor={isMono ? 'currentColor' : '#F59E0B'} />
          <stop offset="72%"  stopColor={isMono ? 'currentColor' : '#D97706'} />
          <stop offset="100%" stopColor={isMono ? 'currentColor' : '#B45309'} />
        </linearGradient>

        {/* Tactile Upper Specular Glass Sheen */}
        <linearGradient id={gradSheen} x1="20" y1="20" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Core Focal Point */}
        <radialGradient id={gradCore} cx="50" cy="50" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={isMono ? 'currentColor' : '#FFFBEB'} stopOpacity="0.95" />
          <stop offset="50%"  stopColor={isMono ? 'currentColor' : '#F59E0B'} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Aura */}
      {(glow || variant === 'glow') && (
        <circle
          cx="50"
          cy="50"
          r="36"
          fill={`url(#${gradCore})`}
          filter={`url(#${filterSoft})`}
          opacity="0.55"
        />
      )}

      {/* Main Kinetic "W" Monogram */}
      <g filter={(glow || variant === 'glow') ? `url(#${filterGlow})` : undefined}>
        
        {/* Kinetic "W" Geometry */}
        <path
          d="
            M 18 24
            C 18 20.68 20.68 18 24 18
            C 26.5 18 28.7 19.5 29.6 21.8
            L 42 56
            L 50 34
            C 50.8 31.8 52.9 30.4 55.2 30.4
            C 57.5 30.4 59.6 31.8 60.4 34
            L 68.4 56
            L 80.8 21.8
            C 81.7 19.5 83.9 18 86.4 18
            C 89.7 18 92.4 20.7 92.4 24
            C 92.4 24.8 92.2 25.6 91.9 26.3
            L 76.5 72.8
            C 75.6 75.3 73.2 77 70.5 77
            C 67.8 77 65.4 75.3 64.5 72.8
            L 55 47
            L 45.5 72.8
            C 44.6 75.3 42.2 77 39.5 77
            C 36.8 77 34.4 75.3 33.5 72.8
            L 18.5 26.3
            C 18.2 25.6 18 24.8 18 24
            Z
          "
          fill={`url(#${gradKinetic})`}
        />

        {/* Specular Highlight Sheen */}
        {!isMono && (
          <path
            d="
              M 24 20
              L 38 60
              L 41 52
              L 28 20
              Z
            "
            fill={`url(#${gradSheen})`}
          />
        )}

        {/* Central Kinetic Pulse Spark */}
        <circle
          cx="55"
          cy="32"
          r="4"
          fill="#FFFFFF"
          opacity={isMono ? '0.7' : '0.9'}
        />
      </g>
    </svg>
  );
}
