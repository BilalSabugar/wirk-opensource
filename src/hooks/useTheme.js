import { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_THEMES, AVAILABLE_STYLES } from '../constants';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('ecv6-theme') || 'dark';
  });

  const [styleTheme, setStyleThemeState] = useState(() => {
    return localStorage.getItem('ecv6-style') || 'professional';
  });

  const [waveState, setWaveState] = useState(null);

  // Synchronize HTML data-theme AND .dark class atomically
  const applyThemeToDOM = useCallback((newTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('ecv6-theme', newTheme);
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-style', styleTheme);
    localStorage.setItem('ecv6-style', styleTheme);
  }, [styleTheme]);

  /**
   * Telegram-inspired radial wave + grain + blur theme toggle
   * @param {MouseEvent|React.MouseEvent} [e] - Optional click event to anchor ripple origin
   */
  const toggle = useCallback((e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Determine click origin coordinates or fallback to screen center
    const x = e && typeof e.clientX === 'number' ? e.clientX : window.innerWidth / 2;
    const y = e && typeof e.clientY === 'number' ? e.clientY : window.innerHeight / 2;

    // Trigger visual wave ripple overlay
    setWaveState({
      id: Date.now(),
      x,
      y,
      from: theme,
      to: nextTheme,
    });

    // If View Transitions API is supported by the browser, use smooth radial clip-path
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 420,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {
        // Fallback if transition fails
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
      });
    } else {
      // Standard atomic switch for browsers without startViewTransition
      applyThemeToDOM(nextTheme);
      setThemeState(nextTheme);
    }
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback((newTheme, e) => {
    if (newTheme === theme) return;
    toggle(e);
  }, [theme, toggle]);

  const isDark = theme !== 'light';

  return {
    theme,
    setTheme,
    styleTheme,
    setStyleTheme: setStyleThemeState,
    toggle,
    isDark,
    waveState,
    clearWave: () => setWaveState(null),
    availableThemes: AVAILABLE_THEMES,
    availableStyles: AVAILABLE_STYLES,
  };
}
