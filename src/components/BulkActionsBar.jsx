import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, Trash2, X, ArrowUp, Flag, Check, 
  ChevronDown, Target, Layers, ArrowRight
} from 'lucide-react';
import { PRIORITIES, TASK_STATUSES } from '../constants';

export default function BulkActionsBar({ 
  count = 0, 
  onMoveStatus, 
  onSetPriority, 
  onPlanToday, 
  onDelete, 
  onClear 
}) {
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openPrioMenu, setOpenPrioMenu] = useState(false);

  const statusRef = useRef(null);
  const prioRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setOpenStatusMenu(false);
      if (prioRef.current && !prioRef.current.contains(e.target)) setOpenPrioMenu(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-40
                    max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar
                    flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border shadow-2xl
                    animate-scale-in whitespace-nowrap"
         style={{
           background: 'var(--modal-bg)',
           borderColor: 'var(--border-subtle)',
           backdropFilter: 'blur(36px) saturate(200%)',
           WebkitBackdropFilter: 'blur(36px) saturate(200%)',
         }}>

      {/* Selected Counter */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
           style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-bold" style={{ color: 'var(--text-hi)' }}>
          {count} selected
        </span>
      </div>

      {/* Move Status Dropdown */}
      <div className="relative" ref={statusRef}>
        <button
          type="button"
          onClick={() => { setOpenStatusMenu(o => !o); setOpenPrioMenu(false); }}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl"
          style={{ color: 'var(--text-hi)' }}
        >
          <Layers size={13} className="text-blue-500" />
          <span>Stage</span>
          <ChevronDown size={11} className={`transition-transform duration-200 ${openStatusMenu ? 'rotate-180' : ''}`} />
        </button>

        {openStatusMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl border shadow-2xl p-1.5 space-y-0.5 z-50 animate-scale-in"
               style={{
                 background: 'var(--modal-bg)',
                 borderColor: 'var(--border-subtle)',
                 backdropFilter: 'blur(32px)',
               }}>
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b mb-1"
                 style={{ borderColor: 'var(--border-subtle)' }}>
              Set Workflow Stage
            </div>
            {Object.entries(TASK_STATUSES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => { onMoveStatus && onMoveStatus(key); setOpenStatusMenu(false); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-hi)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority Dropdown */}
      <div className="relative" ref={prioRef}>
        <button
          type="button"
          onClick={() => { setOpenPrioMenu(o => !o); setOpenStatusMenu(false); }}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl"
          style={{ color: 'var(--text-hi)' }}
        >
          <Flag size={13} className="text-amber-500" />
          <span>Priority</span>
          <ChevronDown size={11} className={`transition-transform duration-200 ${openPrioMenu ? 'rotate-180' : ''}`} />
        </button>

        {openPrioMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl border shadow-2xl p-1.5 space-y-0.5 z-50 animate-scale-in"
               style={{
                 background: 'var(--modal-bg)',
                 borderColor: 'var(--border-subtle)',
                 backdropFilter: 'blur(32px)',
               }}>
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b mb-1"
                 style={{ borderColor: 'var(--border-subtle)' }}>
              Set Priority
            </div>
            {Object.entries(PRIORITIES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => { onSetPriority && onSetPriority(key); setOpenPrioMenu(false); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-hi)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: item.hex }} />
                <span>{item.label} ({item.short})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Plan for Today Button */}
      {onPlanToday && (
        <button
          type="button"
          onClick={onPlanToday}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-emerald-500 hover:text-emerald-400"
          title="Plan selected for Today"
        >
          <Target size={13} />
          <span className="hidden sm:inline">Plan Today</span>
        </button>
      )}

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="btn-ghost p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
        title="Delete selected tasks"
      >
        <Trash2 size={13} />
      </button>

      {/* Clear Selection */}
      <button
        type="button"
        onClick={onClear}
        className="btn-ghost p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-hi)]"
        title="Deselect all"
      >
        <X size={14} />
      </button>
    </div>
  );
}
