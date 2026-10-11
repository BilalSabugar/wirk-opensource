import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

/**
 * InfoTooltip
 * Renders an (i) icon that triggers an unclipped, floating info popover via React Portal.
 * Guaranteed to float above all tabs, cards, headers, and sidebars without clipping.
 */
export default function InfoTooltip({ title, text, size = 13, align }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom-left' });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Recalculate fixed screen position when opening or scrolling/resizing
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let placement = 'bottom-left';
    let top = rect.bottom + 8;
    let left = rect.left;

    if (align === 'sidebar') {
      placement = 'right';
      left = rect.right + 12;
      top = rect.top - 8;
    } else if (rect.left > viewportWidth - 280) {
      placement = 'bottom-right';
      left = rect.right - 260;
    } else if (rect.bottom > viewportHeight - 180) {
      placement = 'top-left';
      top = rect.top - 12; // Will be offset in CSS
    }

    setCoords({ top, left, placement, rect });
  };

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open]);

  // Handle scroll & resize while open
  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Popover style
  const getPopoverStyle = () => {
    const isTop = coords.placement === 'top-left';
    return {
      position: 'fixed',
      zIndex: 999999,
      top: isTop ? 'auto' : coords.top,
      bottom: isTop ? window.innerHeight - (coords.rect?.top ?? 0) + 8 : 'auto',
      left: Math.max(12, Math.min(coords.left, window.innerWidth - 272)),
      width: 260,
      maxWidth: 'calc(100vw - 24px)',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-hi)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-xl)',
      padding: '12px 14px',
    };
  };

  // Arrow style
  const getArrowStyle = () => {
    if (coords.placement === 'right') {
      return {
        position: 'absolute',
        left: -5,
        top: 14,
        width: 8,
        height: 8,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-hi)',
        borderBottom: '1px solid var(--border-hi)',
        transform: 'rotate(45deg)',
      };
    }
    return {
      position: 'absolute',
      top: coords.placement === 'top-left' ? 'auto' : -5,
      bottom: coords.placement === 'top-left' ? -5 : 'auto',
      left: 14,
      width: 8,
      height: 8,
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-hi)',
      borderTop: coords.placement === 'top-left' ? 'none' : '1px solid var(--border-hi)',
      borderBottom: coords.placement === 'top-left' ? '1px solid var(--border-hi)' : 'none',
      transform: 'rotate(45deg)',
    };
  };

  return (
    <>
      <span className="inline-flex items-center shrink-0" ref={triggerRef}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          className="inline-flex items-center justify-center transition-all"
          style={{
            width: size + 6,
            height: size + 6,
            borderRadius: '50%',
            background: open ? 'var(--accent-dim)' : 'transparent',
            color: open ? 'var(--accent)' : 'var(--text-dim)',
            border: `1px solid ${open ? 'var(--border-mid)' : 'transparent'}`,
            cursor: 'help',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.color = 'var(--text-muted)'; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'var(--text-dim)'; }}
          title={title}
          aria-label={`Info: ${title}`}
        >
          <Info size={size - 2}/>
        </button>
      </span>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="animate-scale-in"
          style={getPopoverStyle()}
          onClick={e => e.stopPropagation()}
        >
          <div style={getArrowStyle()}/>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {title}
            </p>
            <button onClick={() => setOpen(false)} className="btn-icon shrink-0"
                    style={{ width: 18, height: 18 }}>
              <X size={11}/>
            </button>
          </div>
          <p style={{ color: 'var(--text-hi)', fontSize: 11, lineHeight: 1.6 }}>
            {text}
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
